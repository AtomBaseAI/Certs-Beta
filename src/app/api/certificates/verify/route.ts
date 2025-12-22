import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { message: 'Verification code is required' },
        { status: 400 }
      )
    }

    const certificate = await db.certificate.findUnique({
      where: { 
        verificationCode: code,
        status: 'issued'
      },
      include: {
        organization: true,
        program: true,
        issuer: {
          select: {
            name: true
          }
        }
      }
    })

    if (!certificate) {
      return NextResponse.json(
        { message: 'Certificate not found or invalid' },
        { status: 404 }
      )
    }

    // Transform the data to use userName instead of studentName
    const transformedCertificate = {
      ...certificate,
      userName: certificate.userName, // This maps to the userName field in the database
      studentName: certificate.userName, // Keep for backward compatibility
      certificateId: certificate.certificateId // Add certificate ID for display
    }

    return NextResponse.json(transformedCertificate)
  } catch (error) {
    console.error('Certificate verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}