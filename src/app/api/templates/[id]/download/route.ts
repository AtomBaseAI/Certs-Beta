import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // Generate HTML for PDF
    const generateHTML = () => {
      const replaceDynamicFields = (content: string) => {
        if (!content) return ''
        return content
          .replace(/\{\{userName\}\}/g, sampleData.userName)
          .replace(/\{\{programName\}\}/g, sampleData.programName)
          .replace(/\{\{organizationName\}\}/g, sampleData.organizationName)
          .replace(/\{\{completionDate\}\}/g, sampleData.completionDate)
      }

      const renderElement = (element: any) => {
        if (element.hidden) return ''

        const baseStyle = `
          position: absolute;
          left: ${element.x}px;
          top: ${element.y}px;
          color: ${element.color || '#000000'};
          ${element.fontSize ? `font-size: ${element.fontSize}px;` : ''}
          ${element.fontWeight ? `font-weight: ${element.fontWeight};` : ''}
          text-align: ${element.textAlign || 'left'};
          background-color: ${element.backgroundColor || 'transparent'};
        `

        switch (element.type) {
          case 'text':
          case 'dynamic-text':
            return `
              <div style="${baseStyle} width: ${element.width || 'auto'}; height: ${element.height || 'auto'};">
                ${replaceDynamicFields(element.content || '')}
              </div>
            `
          
          case 'rectangle':
            return `
              <div style="${baseStyle} 
                width: ${element.width || 100}px; 
                height: ${element.height || 100}px;
                border: ${element.borderWidth || 1}px solid ${element.borderColor || '#000000'};
                background-color: ${element.backgroundColor || 'transparent'};
              "></div>
            `
          
          case 'image':
            return `
              <img src="${element.imageUrl || '/placeholder-image.png'}" 
                style="${baseStyle} 
                  width: ${element.width || 100}px; 
                  height: ${element.height || 100}px;
                  object-fit: contain;
                " alt="" />
            `
          
          default:
            return ''
        }
      }

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${template.name}</title>
          <style>
            @page {
              size: ${template.width || 1123}px ${template.height || 794}px;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .certificate {
              width: ${template.width || 1123}px;
              height: ${template.height || 794}px;
              background-color: ${template.backgroundColor || '#ffffff'};
              ${template.backgroundImage ? `background-image: url(${template.backgroundImage}); background-size: cover; background-position: center;` : ''}
              position: relative;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            ${elements.map(renderElement).join('')}
          </div>
        </body>
        </html>
      `
    }

    // For now, return the HTML as a downloadable file
    // In a real implementation, you would use a PDF library like Puppeteer or jsPDF
    const html = generateHTML()
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${template.name.replace(/\s+/g, '_')}_certificate.html"`
      }
    })

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}