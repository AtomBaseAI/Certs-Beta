import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminEmail = 'admin@atomcerts.com'
  const adminPassword = 'admin123'
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
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

  console.log('✅ Admin user created/updated:', admin.email)
  console.log('📋 Login credentials:')
  console.log('   Email:', adminEmail)
  console.log('   Password:', adminPassword)

  // Create a default certificate template
  const defaultTemplate = await prisma.certificateTemplate.upsert({
    where: { id: 'default-template' },
    update: {},
    create: {
      id: 'default-template',
      name: 'Default Certificate Template',
      description: 'A professional certificate template with standard layout',
      elements: JSON.stringify([
        {
          id: 'title',
          type: 'text',
          content: 'Certificate of Completion',
          x: 400,
          y: 100,
          fontSize: 32,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#1f2937'
        },
        {
          id: 'subtitle',
          type: 'text',
          content: 'This is to certify that',
          x: 400,
          y: 200,
          fontSize: 18,
          textAlign: 'center',
          color: '#4b5563'
        },
        {
          id: 'studentName',
          type: 'text',
          content: '{{userName}}',
          x: 400,
          y: 250,
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#1f2937'
        },
        {
          id: 'programText',
          type: 'text',
          content: 'has successfully completed the',
          x: 400,
          y: 320,
          fontSize: 18,
          textAlign: 'center',
          color: '#4b5563'
        },
        {
          id: 'programName',
          type: 'text',
          content: '{{programName}}',
          x: 400,
          y: 350,
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#1f2937'
        },
        {
          id: 'organizationName',
          type: 'text',
          content: '{{organizationName}}',
          x: 400,
          y: 420,
          fontSize: 16,
          textAlign: 'center',
          color: '#6b7280'
        },
        {
          id: 'date',
          type: 'text',
          content: '{{completionDate}}',
          x: 400,
          y: 480,
          fontSize: 14,
          textAlign: 'center',
          color: '#6b7280'
        },
        {
          id: 'border',
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 700,
          height: 500,
          strokeColor: '#d1d5db',
          strokeWidth: 2,
          fill: 'transparent'
        }
      ]),
      isDefault: true,
      createdBy: admin.id
    }
  })

  console.log('✅ Default certificate template created:', defaultTemplate.name)

  // Create sample organization
  const sampleOrg = await prisma.organization.upsert({
    where: { id: 'sample-org' },
    update: {},
    create: {
      id: 'sample-org',
      name: 'Sample Education Institute',
      description: 'A sample organization for demonstration purposes',
      createdBy: admin.id
    }
  })

  console.log('✅ Sample organization created:', sampleOrg.name)

  // Create sample program
  const sampleProgram = await prisma.program.upsert({
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

  console.log('✅ Sample program created:', sampleProgram.name)

  // Create sample certificates
  const sampleCertificates = [
    {
      certificateId: 'CERT-001',
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      verificationCode: 'ABC123DEF456',
      organizationId: sampleOrg.id,
      programId: sampleProgram.id,
      templateId: defaultTemplate.id,
      issuedBy: admin.id,
      completionDate: new Date('2024-01-15'),
      issueDate: new Date('2024-01-16')
    },
    {
      certificateId: 'CERT-002',
      userName: 'Jane Smith',
      userEmail: 'jane.smith@example.com',
      verificationCode: 'GHI789JKL012',
      organizationId: sampleOrg.id,
      programId: sampleProgram.id,
      templateId: defaultTemplate.id,
      issuedBy: admin.id,
      completionDate: new Date('2024-02-20'),
      issueDate: new Date('2024-02-21')
    },
    {
      certificateId: 'CERT-003',
      userName: 'Bob Johnson',
      userEmail: 'bob.johnson@example.com',
      verificationCode: 'MNO345PQR678',
      organizationId: sampleOrg.id,
      programId: sampleProgram.id,
      templateId: defaultTemplate.id,
      issuedBy: admin.id,
      completionDate: new Date('2024-03-10'),
      issueDate: new Date('2024-03-11')
    }
  ]

  for (const certData of sampleCertificates) {
    const certificate = await prisma.certificate.upsert({
      where: { certificateId: certData.certificateId },
      update: {},
      create: certData
    })
    console.log('✅ Sample certificate created:', certificate.certificateId, 'for', certificate.userName)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })