import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { message: 'Certificate ID or verification code is required' },
        { status: 400 }
      )
    }

    // Try to find certificate by certificateId first, then by verificationCode
    let certificate = await db.certificate.findUnique({
      where: { 
        certificateId: code
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

    // If not found by certificateId, try by verificationCode
    if (!certificate) {
      certificate = await db.certificate.findUnique({
        where: { 
          verificationCode: code
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
    }

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