import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string
    const programId = formData.get('programId') as string
    const templateId = formData.get('templateId') as string

    if (!file || !organizationId || !programId) {
      return NextResponse.json(
        { message: 'File, organization, and program are required' },
        { status: 400 }
      )
    }

    const csvText = await file.text()
    
    const parseResult = new Promise<any[]>((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      })
    })

    const records = await parseResult
    
    const certificates = records.map((record: any) => {
      const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const verificationCode = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()

      return {
        certificateId,
        userName: record.studentName || record.name || '', // This will map to the userName field
        userEmail: record.studentEmail || record.email || null,
        completionDate: record.completionDate ? new Date(record.completionDate) : null,
        verificationCode,
        organizationId,
        programId,
        templateId: templateId || null,
        issuedBy: session.user.id
      }
    }).filter(cert => cert.userName)

    if (certificates.length === 0) {
      return NextResponse.json(
        { message: 'No valid student records found in CSV' },
        { status: 400 }
      )
    }

    await db.certificate.createMany({
      data: certificates
    })

    return NextResponse.json({
      message: `Successfully created ${certificates.length} certificates`,
      count: certificates.length
    })
  } catch (error) {
    console.error('Bulk certificate creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}