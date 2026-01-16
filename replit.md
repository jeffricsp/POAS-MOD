# PO Assessment System

## Overview

This is a Program Outcome (PO) Assessment System designed for educational institutions to track, measure, and analyze student achievement against program outcomes. The system follows Outcome-Based Education (OBE) principles and provides tools for managing program outcomes, courses, surveys, and analytics.

The application supports multiple user roles (student, graduate, program_head, admin, employer) with role-based access control to different features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in shared routes with Zod validation
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: Express sessions stored in MySQL via express-mysql-session

### Data Layer
- **Database**: MySQL (configured via environment variables)
- **ORM**: Drizzle ORM with MySQL adapter
- **Schema Validation**: Drizzle-Zod for type-safe schema definitions
- **Schema Location**: `shared/schema.ts` contains all table definitions

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components (shadcn/ui)
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Route page components
│       └── lib/          # Utility functions
├── server/           # Express backend
│   ├── replit_integrations/  # Replit Auth implementation
│   └── storage.ts    # Database access layer
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod
└── migrations/       # Database migrations (Drizzle Kit)
```

### Key Design Patterns
- **Shared Schema**: Database schema and API types are defined in `shared/` and consumed by both frontend and backend
- **Type-Safe API**: Routes are defined with Zod schemas for input validation and response types
- **Storage Interface**: `server/storage.ts` provides an abstraction layer over database operations
- **Role-Based Access**: User roles control access to different pages and API endpoints

## External Dependencies

### Database
- **MySQL**: Primary database (requires MYSQL_HOSTNAME, MYSQL_DBNAME, MYSQL_USER, MYSQL_PASSWORD environment variables)
- **Drizzle Kit**: Database schema management with `db:push` command

### Authentication
- **Replit Auth**: OpenID Connect integration for user authentication
- **Required Environment Variables**: ISSUER_URL, REPL_ID, SESSION_SECRET

### UI Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **Lucide React**: Icon library
- **Recharts**: Data visualization for analytics
- **Framer Motion**: Animations (listed in requirements)
- **date-fns**: Date formatting utilities

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **TSX**: TypeScript execution for development