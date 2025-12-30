import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import jsPDF from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const certificate = await db.certificate.findUnique({
      where: { id: params.id }
    })

    if (!certificate) {
      return NextResponse.json(
        { message: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Check if certificate is revoked
    if (certificate.status === 'revoked') {
      return NextResponse.json(
        { message: 'Certificate has been revoked and cannot be downloaded' },
        { status: 403 }
      )
    }

    // Parse template elements if template exists
    let elements = []
    let templateConfig = {
      width: 794,
      height: 1123,
      backgroundColor: '#ffffff',
      backgroundImage: null
    }

    if (certificate.template) {
      try {
        elements = certificate.template.elements ? JSON.parse(certificate.template.elements) : []
        templateConfig = {
          width: certificate.template.width || 794,
          height: certificate.template.height || 1123,
          backgroundColor: certificate.template.backgroundColor || '#ffffff',
          backgroundImage: certificate.template.backgroundImage
        }
      } catch (error) {
        console.error('Error parsing template elements:', error)
        elements = []
      }
    }

    // Certificate data
    const certificateData = {
      userName: certificate.userName || 'Student Name',
      programName: certificate.program.name,
      organizationName: certificate.organization.name,
      completionDate: certificate.completionDate ? 
        new Date(certificate.completionDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : 
        new Date(certificate.issueDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
      certificateId: certificate.certificateId,
      verificationCode: certificate.verificationCode,
      issueDate: new Date(certificate.issueDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    // Create PDF using jsPDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [templateConfig.width, templateConfig.height]
    })

    // Add background color if specified
    if (templateConfig.backgroundColor && templateConfig.backgroundColor !== '#ffffff') {
      pdf.setFillColor(templateConfig.backgroundColor)
      pdf.rect(0, 0, templateConfig.width, templateConfig.height, 'F')
    }

    // Add border
    pdf.setDrawColor('#000000')
    pdf.setLineWidth(2)
    pdf.rect(10, 10, templateConfig.width - 20, templateConfig.height - 20)

    // Title
    pdf.setFontSize(32)
    pdf.setTextColor('#1f2937')
    pdf.text('Certificate of Completion', templateConfig.width / 2, 60, { align: 'center' })

    // Subtitle
    pdf.setFontSize(16)
    pdf.setTextColor('#4b5563')
    pdf.text('This is to certify that', templateConfig.width / 2, 100, { align: 'center' })

    // Student Name
    pdf.setFontSize(24)
    pdf.setTextColor('#1f2937')
    pdf.text(certificateData.userName, templateConfig.width / 2, 140, { align: 'center' })

    // Completion text
    pdf.setFontSize(16)
    pdf.setTextColor('#4b5563')
    pdf.text('has successfully completed', templateConfig.width / 2, 180, { align: 'center' })

    // Program Name
    pdf.setFontSize(20)
    pdf.setTextColor('#1f2937')
    pdf.text(certificateData.programName, templateConfig.width / 2, 220, { align: 'center' })

    // Organization Name
    pdf.setFontSize(16)
    pdf.setTextColor('#6b7280')
    pdf.text(certificateData.organizationName, templateConfig.width / 2, 280, { align: 'center' })

    // Completion Date
    pdf.setFontSize(14)
    pdf.setTextColor('#6b7280')
    pdf.text(`Completed on ${certificateData.completionDate}`, templateConfig.width / 2, 340, { align: 'center' })

    // Certificate ID
    pdf.setFontSize(12)
    pdf.setTextColor('#9ca3af')
    pdf.text(`Certificate ID: ${certificateData.certificateId}`, templateConfig.width / 2, 400, { align: 'center' })

    // Verification Code
    pdf.setFontSize(12)
    pdf.setTextColor('#9ca3af')
    pdf.text(`Verification Code: ${certificateData.verificationCode}`, templateConfig.width / 2, 420, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Certificate download error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}