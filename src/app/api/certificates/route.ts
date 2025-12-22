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
    const { 
      studentName, 
      studentEmail, 
      completionDate, 
      organizationId, 
      programId, 
      templateId 
    } = body

    if (!studentName || !organizationId || !programId) {
      return NextResponse.json(
        { message: 'Student name, organization, and program are required' },
        { status: 400 }
      )
    }

    const certificateId = `CERT-${Date.now()}`
    const verificationCode = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()

    const certificate = await db.certificate.create({
      data: {
        certificateId,
        userName: studentName, // This will map to the userName field in the database
        userEmail: studentEmail,
        completionDate: completionDate ? new Date(completionDate) : null,
        verificationCode,
        organizationId,
        programId,
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
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}