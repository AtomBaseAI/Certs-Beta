import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { jsPDF } from 'jspdf'
import { createCanvas } from 'canvas'

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

    // Create a canvas element to render the certificate
    const canvas = createCanvas(template.width || 1123, template.height || 794)
    const ctx = canvas.getContext('2d')

    // Set background color (always set background, even if white)
    const bgColor = template.backgroundColor || '#ffffff'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, template.width || 1123, template.height || 794)

    // Process elements and draw them on canvas
    for (const element of elements) {
      if (element.hidden) continue

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
          
          // Set text color
          ctx.fillStyle = color
          
          // Set font properties
          let fontFamily = 'Arial'
          if (element.fontFamily) {
            // Map common font families to canvas-compatible fonts
            switch (element.fontFamily) {
              case 'Inter':
              case 'Roboto':
              case 'Open Sans':
              case 'Lato':
              case 'Montserrat':
                fontFamily = 'Arial'
                break
              case 'Playfair Display':
              case 'Merriweather':
              case 'Crimson Text':
                fontFamily = 'Georgia'
                break
              case 'Fira Code':
              case 'Space Mono':
                fontFamily = 'Courier New'
                break
              default:
                fontFamily = 'Arial'
            }
          }
          
          let fontStyle = 'normal'
          if (element.fontStyle === 'italic') {
            fontStyle = 'italic'
          }
          
          let fontWeight = 'normal'
          if (element.fontWeight === 'bold') {
            fontWeight = 'bold'
          }
          
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
          
          // Handle text alignment
          ctx.textAlign = element.textAlign || 'left'
          ctx.textBaseline = 'top'
          
          let x = element.x || 0
          const y = element.y || 0
          
          // Add text decoration (underline)
          if (element.textDecoration === 'underline') {
            const textWidth = ctx.measureText(content).width
            let underlineX = x
            
            if (element.textAlign === 'center') {
              underlineX = x - (textWidth / 2)
            } else if (element.textAlign === 'right') {
              underlineX = x - textWidth
            }
            
            ctx.strokeStyle = color
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(underlineX, y + fontSize + 2)
            ctx.lineTo(underlineX + textWidth, y + fontSize + 2)
            ctx.stroke()
          }
          
          ctx.fillText(content, x, y)
          break
        
        case 'rectangle':
          const strokeColor = element.borderColor || element.strokeColor || '#000000'
          const fillColor = element.backgroundColor || 'transparent'
          
          // Set stroke color
          ctx.strokeStyle = strokeColor
          ctx.lineWidth = element.borderWidth || 1
          
          // Set fill color
          if (fillColor && fillColor !== 'transparent') {
            ctx.fillStyle = fillColor
          }
          
          const rectWidth = element.width || 100
          const rectHeight = element.height || 100
          const rectX = element.x || 0
          const rectY = element.y || 0
          
          if (fillColor && fillColor !== 'transparent') {
            ctx.fillRect(rectX, rectY, rectWidth, rectHeight)
          }
          ctx.strokeRect(rectX, rectY, rectWidth, rectHeight)
          break
        
        case 'image':
          // For images, draw a placeholder rectangle
          ctx.fillStyle = '#f4f4f4'
          ctx.fillRect(element.x || 0, element.y || 0, element.width || 100, element.height || 100)
          
          ctx.strokeStyle = '#cccccc'
          ctx.lineWidth = 1
          ctx.strokeRect(element.x || 0, element.y || 0, element.width || 100, element.height || 100)
          
          ctx.fillStyle = '#999999'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('[Image]', (element.x || 0) + (element.width || 100) / 2, (element.y || 0) + (element.height || 100) / 2)
          break
      }
    }

    // Create PDF with proper dimensions
    const pdf = new jsPDF({
      orientation: template.width > template.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [template.width || 1123, template.height || 794]
    })

    // Add the canvas as an image to PDF with full background coverage
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(imgData, 'JPEG', 0, 0, template.width || 1123, template.height || 794)

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