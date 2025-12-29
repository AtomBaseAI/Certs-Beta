import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
      where: { id: params.id },
      include: {
        organization: true,
        program: true,
        template: true
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { message: 'Certificate not found' },
        { status: 404 }
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

    // Generate HTML content for certificate
    const generateCertificateHTML = () => {
      const replaceDynamicFields = (content: string) => {
        if (!content) return ''
        return content
          .replace(/\{\{userName\}\}/g, certificateData.userName)
          .replace(/\{\{programName\}\}/g, certificateData.programName)
          .replace(/\{\{organizationName\}\}/g, certificateData.organizationName)
          .replace(/\{\{completionDate\}\}/g, certificateData.completionDate)
          .replace(/\{\{certificateId\}\}/g, certificateData.certificateId)
          .replace(/\{\{verificationCode\}\}/g, certificateData.verificationCode)
          .replace(/\{\{issueDate\}\}/g, certificateData.issueDate)
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
            const rectStyle = `
              ${baseStyle} 
              width: ${element.width || 100}px; 
              height: ${element.height || 100}px;
              ${element.strokeWidth ? `border: ${element.strokeWidth}px solid ${element.strokeColor || '#000000'};` : ''}
              ${element.fill && element.fill !== 'transparent' ? `background-color: ${element.fill};` : ''}
              ${element.backgroundColor && element.backgroundColor !== 'transparent' ? `background-color: ${element.backgroundColor};` : ''}
            `
            return `<div style="${rectStyle}"></div>`
          
          case 'image':
            // Use a placeholder SVG for images
            const placeholderSVG = `data:image/svg+xml;base64,${Buffer.from(`
              <svg width="${element.width || 100}" height="${element.height || 100}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f4f4f4"/>
                <text x="50%" y="50%" font-family="Arial" font-size="12" fill="#999" text-anchor="middle" dy=".3em">Image</text>
              </svg>
            `).toString('base64')}`
            
            return `
              <img src="${element.imageUrl || placeholderSVG}" 
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

      // If we have template elements, use them
      if (elements.length > 0) {
        return elements.map(renderElement).join('')
      }

      // Otherwise, create a default certificate layout
      return `
        <div style="text-align: center; padding: 60px 40px;">
          <h1 style="font-size: 36px; color: #1f2937; margin-bottom: 20px; font-weight: bold;">Certificate of Completion</h1>
          <p style="font-size: 18px; color: #4b5563; margin-bottom: 30px;">This is to certify that</p>
          <h2 style="font-size: 28px; color: #1f2937; margin-bottom: 30px; font-weight: bold;">${certificateData.userName}</h2>
          <p style="font-size: 18px; color: #4b5563; margin-bottom: 20px;">has successfully completed the</p>
          <h3 style="font-size: 24px; color: #1f2937; margin-bottom: 20px; font-weight: bold;">${certificateData.programName}</h3>
          <p style="font-size: 16px; color: #6b7280; margin-bottom: 40px;">${certificateData.organizationName}</p>
          <div style="position: absolute; bottom: 80px; left: 0; right: 0; text-align: center;">
            <p style="font-size: 14px; color: #6b7280;">Completed on ${certificateData.completionDate}</p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">Certificate ID: ${certificateData.certificateId}</p>
            <p style="font-size: 12px; color: #9ca3af;">Verification Code: ${certificateData.verificationCode}</p>
          </div>
        </div>
      `
    }

    // Create a complete HTML document
    const certificateHTML = generateCertificateHTML()
    
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - ${certificateData.certificateId}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .certificate-container {
            background: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .certificate {
            width: ${templateConfig.width}px;
            height: ${templateConfig.height}px;
            background-color: ${templateConfig.backgroundColor};
            ${templateConfig.backgroundImage ? `background-image: url(${templateConfig.backgroundImage}); background-size: cover; background-position: center; background-repeat: no-repeat;` : ''}
            position: relative;
            overflow: hidden;
        }
        
        @media print {
            body {
                background: none;
                padding: 0;
                display: block;
            }
            
            .certificate-container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .certificate {
                box-shadow: none;
                margin: 0;
            }
        }
        
        .print-instructions {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 14px;
        }
        
        @media print {
            .print-instructions {
                display: none;
            }
        }
        
        .print-btn {
            background: #0070f3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px auto;
            display: block;
            transition: background 0.2s;
        }
        
        .print-btn:hover {
            background: #0051cc;
        }
        
        @media print {
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate">
            ${certificateHTML}
        </div>
    </div>
    
    <div class="print-instructions">
        <button class="print-btn" onclick="window.print()">🖨️ Print to PDF</button>
        <p>Click the button above and select "Save as PDF" in the print dialog</p>
        <p>Or use Ctrl+P / Cmd+P and choose "Save as PDF"</p>
    </div>
    
    <script>
        // Auto-print dialog when page loads
        window.addEventListener('load', function() {
            setTimeout(function() {
                console.log('Ready to print! Use Ctrl+P or Cmd+P to save as PDF.');
            }, 1000);
        });
        
        // Add keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });
    </script>
</body>
</html>
    `

    // Return HTML that can be easily converted to PDF
    return new NextResponse(fullHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="certificate-${certificate.certificateId}.html"`,
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