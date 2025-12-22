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
        design: JSON.stringify({
        width: 1123,
        height: 794,
        backgroundColor: "#ffffff",
        elements: [
          {
            id: "certificate-id-default",
            type: "dynamic-field",
            x: 923,
            y: 20,
            content: "{{certificateId}}",
            fontSize: 12,
            color: "#666666",
            fieldName: "certificateId",
            isDynamic: true
          },
          {
            id: "title",
            type: "text",
            content: "Certificate of Completion",
            x: 561,
            y: 200,
            fontSize: 36,
            fontWeight: "bold",
            textAlign: "center",
            color: "#1f2937"
          },
          {
            id: "subtitle",
            type: "text",
            content: "This is to certify that",
            x: 561,
            y: 300,
            fontSize: 18,
            textAlign: "center",
            color: "#4b5563"
          },
          {
            id: "userName",
            type: "dynamic-field",
            content: "{{userName}}",
            x: 561,
            y: 350,
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            color: "#1f2937",
            fieldName: "userName",
            isDynamic: true
          },
          {
            id: "programText",
            type: "text",
            content: "has successfully completed",
            x: 561,
            y: 420,
            fontSize: 18,
            textAlign: "center",
            color: "#4b5563"
          },
          {
            id: "programName",
            type: "dynamic-field",
            content: "{{programName}}",
            x: 561,
            y: 450,
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center",
            color: "#1f2937",
            fieldName: "programName",
            isDynamic: true
          },
          {
            id: "organizationName",
            type: "dynamic-field",
            content: "{{organizationName}}",
            x: 561,
            y: 520,
            fontSize: 16,
            textAlign: "center",
            color: "#6b7280",
            fieldName: "organizationName",
            isDynamic: true
          },
          {
            id: "completionDate",
            type: "dynamic-field",
            content: "{{completionDate}}",
            x: 561,
            y: 580,
            fontSize: 14,
            textAlign: "center",
            color: "#6b7280",
            fieldName: "completionDate",
            isDynamic: true
          }
        ]
      }),
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