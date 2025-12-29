# Certs-Beta Source Code

This is the complete source code for the Certs-Beta certificate management system.

## Deployment URL
https://preview-chat-1947dd15-1597-467e-8e44-d8995a6e86db.space.z.ai

## Setup Instructions

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Set up database:
   ```bash
   bun run db:push
   ```

4. Seed the database:
   ```bash
   curl -X POST https://preview-chat-1947dd15-1597-467e-8e44-d8995a6e86db.space.z.ai/api/seed
   ```

5. Run the development server:
   ```bash
   bun run dev
   ```

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
