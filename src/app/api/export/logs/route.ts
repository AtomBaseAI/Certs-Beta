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

    const exportLogs = await db.exportLog.findMany({
      include: {
        creator: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 exports
    })

    // Parse JSON filters for each log
    const formattedLogs = exportLogs.map(log => ({
      ...log,
      filters: log.filters ? JSON.parse(log.filters) : null
    }))

    return NextResponse.json({ exportLogs: formattedLogs })
  } catch (error) {
    console.error('Export logs fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}