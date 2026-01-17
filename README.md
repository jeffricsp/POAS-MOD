# PO Assessment System

A Program Outcome (PO) Assessment System designed for educational institutions to track, measure, and analyze student achievement against program outcomes following Outcome-Based Education (OBE) principles.

## Features

- **Program Outcome Management**: Track and manage program outcomes
- **Course Management**: Organize courses and their alignment with program outcomes
- **Survey System**: Conduct surveys for assessment
- **Analytics Dashboard**: Visualize and analyze assessment data
- **Role-Based Access Control**: Support for multiple user roles (student, graduate, program_head, admin, employer)

## Technology Stack

### Frontend
- React 18 with TypeScript
- Wouter for routing
- TanStack React Query for state management
- shadcn/ui components (built on Radix UI)
- Tailwind CSS for styling
- Vite as build tool

### Backend
- Node.js with Express.js
- TypeScript with ESM modules
- RESTful API with Zod validation
- Passport.js for authentication
- Express sessions with MySQL storage

### Database
- MySQL with Drizzle ORM
- Type-safe schema definitions with Drizzle-Zod

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd POAS-MOD
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file with:
   ```
   MYSQL_HOSTNAME=your_mysql_host
   MYSQL_DBNAME=your_database_name
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   SESSION_SECRET=your_session_secret
   PORT=5000
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. For production build:
   ```bash
   npm run build
   npm start
   ```

## Deployment

This application runs on port 5000 by default. For production deployment:

### Phusion Passenger (CloudLinux + DirectAdmin)

**Recommended for DirectAdmin hosting with CloudLinux.**

See [PASSENGER_SETUP.md](PASSENGER_SETUP.md) for complete configuration guide.

**Quick start:**
1. Upload code to `/home/USERNAME/app/`
2. Configure `.htaccess` in `public_html/` (see [QUICK_FIX_PASSENGER.md](QUICK_FIX_PASSENGER.md))
3. Run `npm install`
4. Touch `tmp/restart.txt` to restart

**Your app will be available at:** `http://your-domain.com` (no port needed!)

Passenger provides:
- ✅ Automatic application startup and monitoring
- ✅ Zero-downtime restarts
- ✅ Built-in process management
- ✅ DirectAdmin integration

### Alternative Deployments

#### LiteSpeed Web Server (DirectAdmin)
See [LITESPEED_SETUP.md](LITESPEED_SETUP.md)

#### Cloudflare Tunnel (Recommended for Shared/Reseller Hosting)
See [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)

#### Standard Linux (Ubuntu/Debian with Nginx)
See [NGINX_SETUP.md](NGINX_SETUP.md)

#### DirectAdmin with Apache/Nginx
See [DIRECTADMIN_SETUP.md](DIRECTADMIN_SETUP.md)

**Note:** If your hosting uses Passenger, follow the Passenger guide above. Use Cloudflare Tunnel if you don't have sudo/root access.

## Project Structure

```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components (shadcn/ui)
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Route page components
│       └── lib/          # Utility functions
├── server/           # Express backend
│   ├── replit_integrations/  # Authentication implementation
│   └── storage.ts    # Database access layer
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod
└── script/           # Build scripts
```

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server (compiled)
- `npm run start:prod` - Start production server with TypeScript (for Passenger)
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

### Passenger Deployment (CloudLinux + DirectAdmin)
- `npm run passenger:restart` - Restart Passenger app (creates tmp/restart.txt)
- `npm run passenger:logs` - View Passenger logs
- `npm run passenger:status` - Check Passenger process status

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
