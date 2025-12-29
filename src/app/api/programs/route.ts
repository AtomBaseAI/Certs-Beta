import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const programs = await db.program.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            certificates: true,
            userData: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Programs fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, description, organizationId } = await request.json()

    if (!name || !organizationId) {
      return NextResponse.json(
        { message: 'Name and organization are required' },
        { status: 400 }
      )
    }

    // Verify organization exists
    const organization = await db.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    const program = await db.program.create({
      data: {
        name,
        description,
        organizationId,
        createdBy: session.user.id
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('Program creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}