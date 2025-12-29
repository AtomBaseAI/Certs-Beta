import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { jsPDF } from 'jspdf'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get template from database
    const template = await db.certificateTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { message: 'Template not found' },
        { status: 404 }
      )
    }

    // Parse elements
    let elements = []
    try {
      elements = template.elements ? JSON.parse(template.elements) : []
    } catch (error) {
      console.error('Error parsing template elements:', error)
      elements = []
    }

    // Sample data for dynamic fields
    const sampleData = {
      userName: 'John Doe',
      programName: 'Web Development Fundamentals',
      organizationName: 'Sample Education Institute',
      completionDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }

    // Create PDF document with landscape orientation
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [template.height || 1123, template.width || 794] // Swap width/height for landscape
    })

    // Set background color if specified
    if (template.backgroundColor && template.backgroundColor !== '#ffffff') {
      pdf.setFillColor(template.backgroundColor)
      pdf.rect(0, 0, template.height || 1123, template.width || 794, 'F') // Use landscape dimensions
    }

    // Process elements
    elements.forEach((element: any) => {
      if (element.hidden) return

      const replaceDynamicFields = (content: string) => {
        if (!content) return ''
        return content
          .replace(/\{\{userName\}\}/g, sampleData.userName)
          .replace(/\{\{programName\}\}/g, sampleData.programName)
          .replace(/\{\{organizationName\}\}/g, sampleData.organizationName)
          .replace(/\{\{completionDate\}\}/g, sampleData.completionDate)
      }

      switch (element.type) {
        case 'text':
        case 'dynamic-text':
          const content = replaceDynamicFields(element.content || '')
          const fontSize = element.fontSize || 12
          const color = element.color || '#000000'
          
          // Convert hex color to RGB for jsPDF
          const rgb = hexToRgb(color)
          if (rgb) {
            pdf.setTextColor(rgb.r, rgb.g, rgb.b)
          }
          
          pdf.setFontSize(fontSize)
          
          // Set font weight
          if (element.fontWeight === 'bold') {
            pdf.setFont('helvetica', 'bold')
          } else {
            pdf.setFont('helvetica', 'normal')
          }
          
          // Handle text alignment
          const textWidth = pdf.getTextWidth(content)
          let x = element.x || 0
          
          if (element.textAlign === 'center') {
            x = (element.x || 0) - (textWidth / 2)
          } else if (element.textAlign === 'right') {
            x = (element.x || 0) - textWidth
          }
          
          pdf.text(content, x, element.y || 0)
          break
        
        case 'rectangle':
          const strokeColor = element.strokeColor || '#000000'
          const fillColor = element.fill || element.backgroundColor || 'transparent'
          
          // Set stroke color
          const strokeRgb = hexToRgb(strokeColor)
          if (strokeRgb) {
            pdf.setDrawColor(strokeRgb.r, strokeRgb.g, strokeRgb.b)
          }
          
          // Set fill color
          if (fillColor && fillColor !== 'transparent') {
            const fillRgb = hexToRgb(fillColor)
            if (fillRgb) {
              pdf.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
            }
          }
          
          const rectWidth = element.width || 100
          const rectHeight = element.height || 100
          const rectX = element.x || 0
          const rectY = element.y || 0
          const strokeWidth = element.strokeWidth || 1
          
          if (fillColor && fillColor !== 'transparent') {
            pdf.rect(rectX, rectY, rectWidth, rectHeight, 'FD')
          } else {
            pdf.rect(rectX, rectY, rectWidth, rectHeight, 'D')
          }
          
          if (strokeWidth > 1) {
            pdf.setLineWidth(strokeWidth)
            pdf.rect(rectX, rectY, rectWidth, rectHeight, 'D')
          }
          break
        
        case 'image':
          // For images, draw a placeholder rectangle
          pdf.setDrawColor(200, 200, 200)
          pdf.setFillColor(244, 244, 244)
          pdf.rect(element.x || 0, element.y || 0, element.width || 100, element.height || 100, 'FD')
          
          pdf.setTextColor(150, 150, 150)
          pdf.setFontSize(10)
          pdf.text('[Image]', (element.x || 0) + (element.width || 100) / 2 - 15, (element.y || 0) + (element.height || 100) / 2)
          break
      }
    })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${template.name.replace(/\s+/g, '_')}_certificate.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}