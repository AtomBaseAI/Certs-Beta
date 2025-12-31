import jsPDF from 'jspdf'
import { Certificate, Organization, Program, CertificateTemplate } from '@prisma/client'

export interface CertificateWithRelations extends Certificate {
  organization: Organization
  program: Program
  template: CertificateTemplate | null
}

export interface CertificateData {
  userName: string
  programName: string
  organizationName: string
  completionDate: string
  certificateId: string
  verificationCode: string
  issueDate: string
}

export function generateCertificatePDF(certificate: CertificateWithRelations): Buffer {
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
  const certificateData: CertificateData = {
    userName: certificate.userName || certificate.studentName || 'Student Name',
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

  // Create PDF using jsPDF with template dimensions
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

  // Function to replace template variables
  const replaceTemplateVariables = (content: string): string => {
    if (!content) return ''
    return content
      .replace(/\{\{userName\}\}/g, certificateData.userName)
      .replace(/\{\{programName\}\}/g, certificateData.programName)
      .replace(/\{\{organizationName\}\}/g, certificateData.organizationName)
      .replace(/\{\{completionDate\}\}/g, certificateData.completionDate)
      .replace(/\{\{certificateId\}\}/g, certificateData.certificateId)
      .replace(/\{\{verificationCode\}\}/g, certificateData.verificationCode)
      .replace(/\{\{issueDate\}\}/g, certificateData.issueDate)
      .replace(/\{\{date\}\}/g, certificateData.completionDate)
      .replace(/\{\{studentName\}\}/g, certificateData.userName)
      .replace(/\{\{studentEmail\}\}/g, certificate.userEmail || certificate.studentEmail || '')
  }

  // Render template elements
  if (elements.length > 0) {
    elements.forEach((element: any) => {
      const { type, x, y, width, height, content, fontSize, fontWeight, textAlign, color, strokeColor, strokeWidth, fill } = element

      switch (type) {
        case 'text':
        case 'dynamic-text':
          const processedContent = replaceTemplateVariables(content || '')
          pdf.setFontSize(fontSize || 12)
          pdf.setTextColor(color || '#000000')
          
          if (fontWeight === 'bold') {
            pdf.setFont('helvetica', 'bold')
          } else {
            pdf.setFont('helvetica', 'normal')
          }

          // Handle text alignment
          const textOptions: any = {}
          if (textAlign === 'center') {
            textOptions.align = 'center'
          } else if (textAlign === 'right') {
            textOptions.align = 'right'
          }

          // Handle multi-line text
          const lines = processedContent.split('\n')
          lines.forEach((line: string, index: number) => {
            const yOffset = y + (index * (fontSize || 12) * 1.2)
            pdf.text(line, x, yOffset, textOptions)
          })
          break

        case 'rectangle':
          if (strokeColor) {
            pdf.setDrawColor(strokeColor)
          }
          if (strokeWidth) {
            pdf.setLineWidth(strokeWidth)
          }
          if (fill && fill !== 'transparent') {
            pdf.setFillColor(fill)
            pdf.rect(x, y, width || 100, height || 50, 'FD')
          } else {
            pdf.rect(x, y, width || 100, height || 50)
          }
          break

        case 'image':
          // Images would need to be handled separately
          // For now, we'll skip image rendering in PDF
          console.log('Image element skipped in PDF generation:', element)
          break
      }
    })
  } else {
    // Fallback to default layout if no template elements
    pdf.setFontSize(24)
    pdf.setTextColor('#1f2937')
    pdf.text('Certificate of Completion', templateConfig.width / 2, 100, { align: 'center' })

    pdf.setFontSize(14)
    pdf.setTextColor('#4b5563')
    pdf.text('This is to certify that', templateConfig.width / 2, 140, { align: 'center' })

    pdf.setFontSize(20)
    pdf.setTextColor('#1f2937')
    pdf.text(certificateData.userName, templateConfig.width / 2, 180, { align: 'center' })

    pdf.setFontSize(16)
    pdf.setTextColor('#1f2937')
    pdf.text(certificateData.programName, templateConfig.width / 2, 220, { align: 'center' })

    pdf.setFontSize(14)
    pdf.setTextColor('#6b7280')
    pdf.text(certificateData.organizationName, templateConfig.width / 2, 260, { align: 'center' })

    pdf.setFontSize(12)
    pdf.setTextColor('#6b7280')
    pdf.text(`Completed on ${certificateData.completionDate}`, templateConfig.width / 2, 300, { align: 'center' })
  }

  // Generate PDF buffer
  const arrayBuffer = pdf.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}