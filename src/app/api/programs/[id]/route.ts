import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
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

    const program = await db.program.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!program) {
      return NextResponse.json(
        { message: 'Program not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Program fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
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

    const { name, description, organizationId } = await request.json()

    if (!name || !organizationId) {
      return NextResponse.json(
        { message: 'Name and organization are required' },
        { status: 400 }
      )
    }

    // Verify program exists and organization exists
    const existingProgram = await db.program.findUnique({
      where: { id: params.id }
    })

    if (!existingProgram) {
      return NextResponse.json(
        { message: 'Program not found' },
        { status: 404 }
      )
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found' },
        { status: 404 }
      )
    }

    const program = await db.program.update({
      where: { id: params.id },
      data: {
        name,
        description,
        organizationId
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

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Program update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
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

    const program = await db.program.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            certificates: true,
            userData: true
          }
        }
      }
    })

    if (!program) {
      return NextResponse.json(
        { message: 'Program not found' },
        { status: 404 }
      )
    }

    // Check if program has certificates or user data
    if (program._count.certificates > 0 || program._count.userData > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete program with existing certificates or user data',
          hasCertificates: program._count.certificates > 0,
          hasUserData: program._count.userData > 0
        },
        { status: 400 }
      )
    }

    await db.program.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Program deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}