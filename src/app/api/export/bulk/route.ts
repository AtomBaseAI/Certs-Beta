import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import JSZip from 'jszip'
import { v4 as uuidv4 } from 'uuid'

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
    const { organization, program, status } = body

    // Build the where clause for filtering
    const whereClause: any = {}
    
    if (organization && organization !== 'all') {
      whereClause.organizationId = organization
    }
    
    if (program && program !== 'all') {
      whereClause.programId = program
    }
    
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Fetch certificates with filters
    const certificates = await db.certificate.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' }
    })

    if (certificates.length === 0) {
      return NextResponse.json(
        { message: 'No certificates found matching the specified filters' },
        { status: 404 }
      )
    }

    // Create a ZIP file containing all certificates
    const zip = new JSZip()
    
    // Add CSV summary
    const csvHeaders = [
      'Certificate ID',
      'User Name',
      'User Email',
      'Organization',
      'Program',
      'Template',
      'Issue Date',
      'Completion Date',
      'Verification Code',
      'Status'
    ]
    
    const csvRows = certificates.map(cert => [
      cert.certificateId,
      cert.userName,
      cert.userEmail || '',
      cert.organization.name,
      cert.program.name,
      cert.template?.name || 'N/A',
      cert.issueDate.toISOString().split('T')[0],
      cert.completionDate?.toISOString().split('T')[0] || '',
      cert.verificationCode,
      cert.status
    ])
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    zip.file('certificates-summary.csv', csvContent)

    // For now, we'll add a JSON file with certificate data
    // In a real implementation, you would generate actual PDF certificates
    const certificatesData = certificates.map(cert => ({
      certificateId: cert.certificateId,
      userName: cert.userName,
      userEmail: cert.userEmail,
      organization: cert.organization.name,
      program: cert.program.name,
      template: cert.template?.name,
      issueDate: cert.issueDate,
      completionDate: cert.completionDate,
      verificationCode: cert.verificationCode,
      status: cert.status
    }))
    
    zip.file('certificates-data.json', JSON.stringify(certificatesData, null, 2))

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' })
    
    // Create a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `certificates-export-${timestamp}.zip`

    // Create export log
    await db.exportLog.create({
      data: {
        fileName,
        status: 'completed',
        totalCertificates: certificates.length,
        filters: JSON.stringify({
          organization: organization || undefined,
          program: program || undefined,
          status: status || undefined
        }),
        completedAt: new Date(),
        createdBy: session.user.id
      }
    })

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Bulk export error:', error)
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}