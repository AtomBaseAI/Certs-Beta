import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const total = await db.certificate.count({
      where: { status: 'issued' }
    })

    return NextResponse.json({ total })
  } catch (error) {
    console.error('Certificate stats error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}