import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'https://preview-chat-1947dd15-1597-467e-8e44-d8995a6e86db.space.z.ai';

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env',
  '.env.local',
  '.env.production',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '*.tmp',
  '*.temp'
];

// File extensions to include
const INCLUDE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md',
  '.prisma', '.sql', '.css', '.scss', '.sass',
  '.html', '.xml', '.yml', '.yaml', '.txt',
  '.gitignore', '.eslintrc', '.prettierrc',
  'Dockerfile', 'docker-compose.yml'
];

async function shouldIncludeFile(filePath: string): Promise<boolean> {
  const fileName = filePath.split('/').pop() || '';
  
  // Check if file matches exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (filePath.includes(pattern) || fileName.includes(pattern)) {
      return false;
    }
  }
  
  // Check if file has included extension
  for (const ext of INCLUDE_EXTENSIONS) {
    if (fileName.endsWith(ext) || fileName === ext) {
      return true;
    }
  }
  
  return false;
}

async function addFilesToZip(zip: JSZip, dirPath: string, zipPath: string = ''): Promise<void> {
  try {
    const items = await readdir(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const relativePath = zipPath ? `${zipPath}/${item}` : item;
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Recursively add directory contents
          await addFilesToZip(zip, fullPath, relativePath);
        } else if (stats.isFile() && await shouldIncludeFile(relativePath)) {
          // Add file to zip
          try {
            const content = await readFile(fullPath, 'utf8');
            zip.file(relativePath, content);
          } catch (error) {
            console.warn(`Could not read file: ${fullPath}`, error);
          }
        }
      } catch (error) {
        console.warn(`Could not stat item: ${fullPath}`, error);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory: ${dirPath}`, error);
  }
}

export async function GET() {
  try {
    const zip = new JSZip();
    
    // Add project files
    const projectRoot = process.cwd();
    await addFilesToZip(zip, projectRoot);
    
    // Add a README with the deployment URL
    const readmeContent = `# Certs-Beta Source Code

This is the complete source code for the Certs-Beta certificate management system.

## Deployment URL
${BASE_URL}

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   bun install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Set up database:
   \`\`\`bash
   bun run db:push
   \`\`\`

4. Seed the database:
   \`\`\`bash
   curl -X POST ${BASE_URL}/api/seed
   \`\`\`

5. Run the development server:
   \`\`\`bash
   bun run dev
   \`\`\`

## Features

- Certificate template creation and management
- Organization and program management
- Bulk certificate generation
- Certificate verification system
- Admin dashboard
- PDF download functionality

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite Database
- NextAuth.js
- shadcn/ui components

## License

This project is licensed under the MIT License.
`;
    
    zip.file('README.md', readmeContent);
    
    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Return zip file as response
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="certs-beta-source-code.zip"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Error creating zip file:', error);
    return NextResponse.json(
      { error: 'Failed to create zip file' },
      { status: 500 }
    );
  }
}