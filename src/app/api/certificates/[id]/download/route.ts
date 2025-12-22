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

    // For now, return a simple PDF placeholder
    // In a real implementation, you would generate a PDF using a library like puppeteer
    const pdfContent = `Certificate for ${certificate.studentName}\n` +
      `Program: ${certificate.program.name}\n` +
      `Organization: ${certificate.organization.name}\n` +
      `Certificate ID: ${certificate.certificateId}\n` +
      `Verification Code: ${certificate.verificationCode}\n` +
      `Issue Date: ${certificate.issueDate}`

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateId}.pdf"`
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