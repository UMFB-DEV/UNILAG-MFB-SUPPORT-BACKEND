# Ticketing System Backend

RESTful backend API for a Ticketing Management System using Node.js, Express, PostgreSQL, Prisma, JWT authentication, bcrypt, and Nodemailer.

## Features

- JWT authentication (`register`, `login`, `me`)
- Role-based access control (`admin`, `agent`, `user`)
- Ticket lifecycle with status transition rules
- Public/internal comments
- Email notifications (Gmail service)
- Reports summary + CSV export
- Filtering and pagination on tickets
- User and ticket deletion with safety checks

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repo>
   cd Ticketing-System-backend
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (or create manually)
   - Required vars:
     ```env
     DATABASE_URL=postgresql://...
     JWT_SECRET=your-secret
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-gmail-app-password
     SMTP_FROM="Ticketing System <your-email@gmail.com>"
     ```
   - Optional:
     ```env
     PORT=4000
     FRONTEND_URL=http://localhost:3000
     ```

3. **Database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Run**
   ```bash
   npm run dev
   ```

## Core Endpoints

### Auth
- `POST /auth/register` – Register end users
- `POST /auth/login` – Login and receive JWT
- `GET /auth/me` – Get current user profile
- `POST /auth/register-agent` – Register agents (admin only)

### Users (Admin only)
- `GET /users` – List all users
- `POST /users` – Create a user
- `PATCH /users/:id` – Update user
- `DELETE /users/:id` – Delete user (blocks if user created tickets)

### Tickets
- `POST /tickets` – Create ticket (any role)
- `GET /tickets` – List tickets with filtering/pagination
- `GET /tickets/:id` – Get single ticket
- `PATCH /tickets/:id` – Update ticket
- `DELETE /tickets/:id` – Delete ticket
- `PATCH /tickets/:id/assign` – Assign ticket to agent
- `PATCH /tickets/:id/status` – Change ticket status
- `POST /tickets/:id/comments` – Add comment (public/internal)
- `GET /tickets/:id/comments` – List comments (users see public only)

### Reports
- `GET /reports/summary` – Summary stats
- `GET /reports/export` – CSV export

## Ticket Workflow Rules

- **Status transitions:**
  - `open → in_progress → resolved → closed`
- **Who can change status:** `admin`/`agent`
- **Who can resolve:** Only assigned agent
- **Closed tickets:** Cannot be edited or commented

## Filtering (`GET /tickets`)

Query params:
- `status` (`open`|`in_progress`|`resolved`|`closed`)
- `priority` (`low`|`medium`|`high`)
- `category` (string)
- `assignedTo` (UUID)
- `createdBy` (UUID)
- `startDate`/`endDate` (ISO datetime)
- `keyword` (searches title/description)
- `page` (number, default 1)
- `limit` (number, max 100, default 20)

## Comments

- **Public comments:** Emailed to ticket creator and assigned agent
- **Internal comments:** Visible to agents/admins only
- **Permissions:**
  - Users: only on their own tickets, public only
  - Agents: only on assigned tickets
  - Admins: all tickets, all comments

## Deletion Safety

- **Users:** Blocked if they created any tickets (409). Otherwise, deletes dependent comments/password reset tokens and unassigns tickets.
- **Tickets:** Direct deletion allowed; consider adding soft deletes if needed.

## Email Configuration

- Uses **Gmail service** (`SMTP_USER` + `SMTP_PASS` + `SMTP_FROM`)
- No `SMTP_HOST`/`SMTP_PORT` required.
- Failures are logged and won’t crash endpoints.

## Deployment (Render)

- Build command: `npm run build`
- Start command: `npm start`
- Ensure all env vars are set in Render dashboard.
- Port is injected by Render (`process.env.PORT`).

## Scripts

- `npm run dev` – Start with nodemon
- `npm run build` – Build for production
- `npm start` – Start production server
- `npm run prisma:generate` – Regenerate Prisma client
- `npm run prisma:migrate` – Run migrations
- `npm run prisma:studio` – Open Prisma Studio

## License

MIT
