import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const certificates = await db.certificate.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        },
        issuer: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Recent certificates error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}