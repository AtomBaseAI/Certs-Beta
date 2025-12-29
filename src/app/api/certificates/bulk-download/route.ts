import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const certificates = await db.certificate.findMany({
      where: { status: 'issued' },
      include: {
        organization: true,
        program: true
      }
    })

    // For now, return a simple CSV file
    // In a real implementation, you would generate actual PDFs and zip them
    const csvContent = [
      'Certificate ID,User Name,User Email,Program,Organization,Issue Date,Verification Code',
      ...certificates.map(cert => 
        `${cert.certificateId},"${cert.userName}","${cert.userEmail || ''}","${cert.program.name}","${cert.organization.name}","${cert.issueDate}","${cert.verificationCode}"`
      )
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="certificates.csv"'
      }
    })
  } catch (error) {
    console.error('Bulk download error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}