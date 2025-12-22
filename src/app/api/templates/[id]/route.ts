import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
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

    const body = await request.json()
    const { name, description, width, height, backgroundColor, backgroundImage, elements } = body

    if (!name || !elements) {
      return NextResponse.json(
        { message: 'Name and elements are required' },
        { status: 400 }
      )
    }

    const template = await db.certificateTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description: description || '',
        width: width || 1123,
        height: height || 794,
        backgroundColor: backgroundColor || '#ffffff',
        backgroundImage: backgroundImage || '',
        elements
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const template = await db.certificateTemplate.findUnique({
      where: { id: params.id }
    })

    if (template?.isDefault) {
      return NextResponse.json(
        { message: 'Cannot delete default template' },
        { status: 400 }
      )
    }

    await db.certificateTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Template deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}