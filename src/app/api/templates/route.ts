import { NextRequest, NextResponse } from 'next/server'
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

    const templates = await db.certificateTemplate.findMany({
      include: {
        creator: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const template = await db.certificateTemplate.create({
      data: {
        name,
        description: description || '',
        width: width || 1123,
        height: height || 794,
        backgroundColor: backgroundColor || '#ffffff',
        backgroundImage: backgroundImage || '',
        elements,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}