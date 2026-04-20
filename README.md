# Ticketing System Backend

RESTful backend API for a Ticketing Management System using Node.js, Express, PostgreSQL, Prisma, JWT authentication, bcrypt, and Nodemailer.

## Features

- JWT authentication (`register`, `login`, `me`)
- Role-based access control (`admin`, `agent`, `user`)
- Ticket lifecycle with status transition rules
- Public/internal comments
- Email notification hooks
- Reports summary + CSV export
- Filtering and pagination on tickets

## Setup

1. Copy environment file:
   - `cp .env.example .env` (or create manually on Windows)
2. Configure:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - SMTP credentials
3. Install dependencies:
   - `npm install`
4. Generate Prisma client:
   - `npm run prisma:generate`
5. Run migrations:
   - `npm run prisma:migrate -- --name init`
6. Start API:
   - `npm run dev`

## Core Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Users (Admin only)

- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Tickets

- `POST /tickets`
- `GET /tickets`
- `GET /tickets/:id`
- `PATCH /tickets/:id`
- `DELETE /tickets/:id`
- `PATCH /tickets/:id/assign`
- `PATCH /tickets/:id/status`
- `POST /tickets/:id/comments`
- `GET /tickets/:id/comments`

### Reports

- `GET /reports/summary`
- `GET /reports/export`

## Ticket Workflow Rules

- `open -> in_progress`
- `in_progress -> resolved`
- `resolved -> closed`
- Only `admin`/`agent` can change status
- Only assigned agent can resolve
- Closed tickets cannot be edited

## Filtering (`GET /tickets`)

Supports:

- `status`
- `priority`
- `category`
- `assignedTo`
- `createdBy`
- `startDate`
- `endDate`
- `keyword`
- `page`
- `limit`
