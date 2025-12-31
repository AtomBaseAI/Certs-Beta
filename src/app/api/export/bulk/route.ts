import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateCertificatePDF } from '@/lib/pdf-generator'
import JSZip from 'jszip'

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
          select: { 
            name: true,
            elements: true,
            width: true,
            height: true,
            backgroundColor: true,
            backgroundImage: true
          }
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
      cert.userName || cert.studentName,
      cert.userEmail || cert.studentEmail || '',
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

    // Generate individual PDF certificates and add them to the ZIP
    const pdfPromises = certificates.map(async (cert) => {
      try {
        const pdfBuffer = generateCertificatePDF(cert)
        const fileName = `${cert.certificateId}-${cert.userName || cert.studentName || 'Student'}.pdf`
          .replace(/[^a-zA-Z0-9-_.]/g, '_') // Sanitize filename
        return { fileName, pdfBuffer }
      } catch (error) {
        console.error(`Error generating PDF for certificate ${cert.certificateId}:`, error)
        return null
      }
    })

    const pdfResults = await Promise.all(pdfPromises)
    
    // Count successful PDF generations
    const successfulPDFs = pdfResults.filter(result => result !== null).length
    
    // Add PDF files to ZIP
    pdfResults.forEach((result) => {
      if (result) {
        zip.file(`certificates/${result.fileName}`, result.pdfBuffer)
      }
    })

    // Add summary JSON file
    const certificatesData = certificates.map(cert => ({
      certificateId: cert.certificateId,
      userName: cert.userName || cert.studentName,
      userEmail: cert.userEmail || cert.studentEmail,
      organization: cert.organization.name,
      program: cert.program.name,
      template: cert.template?.name,
      issueDate: cert.issueDate,
      completionDate: cert.completionDate,
      verificationCode: cert.verificationCode,
      status: cert.status
    }))
    
    zip.file('certificates-summary.json', JSON.stringify(certificatesData, null, 2))

    // Add README file to explain the contents
    const readmeContent = `Certificate Export Summary
========================

This ZIP file contains:

1. certificates-summary.csv - A CSV spreadsheet with all certificate details
2. certificates-summary.json - Detailed certificate data in JSON format
3. certificates/ folder - Individual PDF certificate files

Export Details:
- Total Certificates: ${certificates.length}
- PDFs Generated: ${successfulPDFs}
- Export Date: ${new Date().toLocaleString()}
- Filters Applied: ${organization ? `Organization: ${organization}` : 'All Organizations'}${program ? `, Program: ${program}` : ''}${status ? `, Status: ${status}` : ''}

Each PDF certificate is formatted according to its assigned template and includes:
- Student name and program details
- Organization information
- Completion and issue dates
- Unique verification code
- Professional certificate design

Generated by AtomBase Certs Beta
`
    zip.file('README.txt', readmeContent)

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

    console.log(`✅ Export completed: ${certificates.length} certificates, ${successfulPDFs} PDFs generated`)

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