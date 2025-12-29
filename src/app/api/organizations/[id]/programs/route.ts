import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const programs = await db.program.findMany({
      where: { organizationId: params.orgId },
      include: {
        _count: {
          select: {
            certificates: true,
            userData: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Organization programs fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}