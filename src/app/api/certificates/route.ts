import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const certificates = await db.certificate.findMany({
      include: {
        organization: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        },
        template: {
          select: { name: true }
        },
        issuer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Certificates fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Comprehensive debugging
    
    const { 
      certificateId,
      userName, 
      studentName, 
      userEmail, 
      completionDate, 
      organizationId, 
      programId, 
      templateId 
    } = body


    // Use the certificateId from frontend or generate a fallback
    const finalCertificateId = certificateId || `CERT-${Date.now()}`
    
    // Support both userName and studentName for backward compatibility
    const finalUserName = userName || studentName
    const finalUserEmail = userEmail
    

    if (!finalUserName || !organizationId || !programId) {
      
      return NextResponse.json(
        { 
          message: 'User name, organization, and program are required',
          debug: {
            finalUserName: !!finalUserName,
            organizationId: !!organizationId,
            programId: !!programId,
            templateId: !!templateId
          }
        },
        { status: 400 }
      )
    }


    // Smart organization lookup - try ID first, then name
    let organization = await db.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      organization = await db.organization.findFirst({
        where: { name: organizationId }
      })
    }

    if (!organization) {
      return NextResponse.json(
        { 
          error: 'Organization not found',
          debug: {
            received: organizationId,
            message: 'Organization not found by ID or name'
          }
        },
        { status: 400 }
      )
    }


    // Smart program lookup - try ID first, then name
    let program = await db.program.findUnique({
      where: { id: programId }
    })

    if (!program) {
      program = await db.program.findFirst({
        where: { 
          name: programId,
          organizationId: organization.id 
        }
      })
    }

    if (!program) {
      return NextResponse.json(
        { 
          error: 'Program not found',
          debug: {
            received: programId,
            message: 'Program not found by ID or name',
            organizationId: organization.id
          }
        },
        { status: 400 }
      )
    }


    const verificationCode = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()

    const certificate = await db.certificate.create({
      data: {
        certificateId: finalCertificateId,
        userName: finalUserName, // This will map to the userName field in the database
        userEmail: finalUserEmail,
        completionDate: completionDate ? new Date(completionDate) : null,
        verificationCode,
        organizationId: organization.id, // Use the verified organization ID
        programId: program.id, // Use the verified program ID
        templateId,
        issuedBy: session.user.id
      },
      include: {
        organization: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        },
        template: {
          select: { name: true }
        }
      }
    })


    return NextResponse.json(certificate)
  } catch (error) {
    console.error('Certificate creation error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}