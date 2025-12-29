import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Create admin user
    const adminEmail = 'admin@atomcerts.com'
    const adminPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    const admin = await db.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'admin',
        name: 'Administrator'
      },
      create: {
        email: adminEmail,
        name: 'Administrator',
        role: 'admin',
        password: hashedPassword
      }
    })

    // Create a default certificate template
    const defaultTemplate = await db.certificateTemplate.upsert({
      where: { id: 'default-template' },
      update: {},
      create: {
        id: 'default-template',
        name: 'Default Certificate Template',
        description: 'A professional certificate template with standard layout',
        elements: JSON.stringify([
          {
            id: "title",
            type: "text",
            content: "Certificate of Completion",
            x: 400,
            y: 100,
            fontSize: 32,
            fontWeight: "bold",
            textAlign: "center",
            color: "#1f2937"
          },
          {
            id: "subtitle",
            type: "text",
            content: "This is to certify that",
            x: 400,
            y: 200,
            fontSize: 18,
            textAlign: "center",
            color: "#4b5563"
          },
          {
            id: "userName",
            type: "text",
            content: "{{userName}}",
            x: 400,
            y: 250,
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            color: "#1f2937"
          },
          {
            id: "programText",
            type: "text",
            content: "has successfully completed the",
            x: 400,
            y: 320,
            fontSize: 18,
            textAlign: "center",
            color: "#4b5563"
          },
          {
            id: "programName",
            type: "text",
            content: "{{programName}}",
            x: 400,
            y: 350,
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center",
            color: "#1f2937"
          },
          {
            id: "organizationName",
            type: "text",
            content: "{{organizationName}}",
            x: 400,
            y: 420,
            fontSize: 16,
            textAlign: "center",
            color: "#6b7280"
          },
          {
            id: "completionDate",
            type: "text",
            content: "{{completionDate}}",
            x: 400,
            y: 480,
            fontSize: 14,
            textAlign: "center",
            color: "#6b7280"
          },
          {
            id: "border",
            type: "rectangle",
            x: 50,
            y: 50,
            width: 700,
            height: 500,
            strokeColor: "#d1d5db",
            strokeWidth: 2,
            fill: "transparent"
          }
        ]),
        createdBy: admin.id
      }
    })

    // Create sample organization
    const sampleOrg = await db.organization.upsert({
      where: { id: 'sample-org' },
      update: {},
      create: {
        id: 'sample-org',
        name: 'Sample Education Institute',
        description: 'A sample organization for demonstration purposes',
        createdBy: admin.id
      }
    })

    // Create sample program
    const sampleProgram = await db.program.upsert({
      where: { id: 'sample-program' },
      update: {},
      create: {
        id: 'sample-program',
        name: 'Web Development Fundamentals',
        description: 'Learn the basics of modern web development',
        organizationId: sampleOrg.id,
        createdBy: admin.id
      }
    })

    return NextResponse.json({
      message: 'Database seeded successfully',
      admin: { email: admin.email, name: admin.name },
      template: { name: defaultTemplate.name },
      organization: { name: sampleOrg.name },
      program: { name: sampleProgram.name }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { message: 'Failed to seed database' },
      { status: 500 }
    )
  }
}