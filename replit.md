# PingJob - Job Board and Professional Networking Platform

## Overview

PingJob is a full-stack web application built with React, TypeScript, Express.js, and PostgreSQL. It serves as a comprehensive job board and professional networking platform, featuring user authentication, company management, job listings, and professional profiles.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Client-side routing handled by React components

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with session-based authentication
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple
- **File Uploads**: Multer middleware for handling file uploads (documents, images)
- **API Design**: RESTful endpoints with JSON responses

### Data Storage Solutions
- **Primary Database**: PostgreSQL (Neon.tech hosted)
- **Session Management**: Database-backed sessions stored in PostgreSQL
- **File Storage**: Local filesystem storage in `/uploads` directory
- **Connection Management**: Connection pooling with pg library

## Key Components

### Authentication System
- **Implementation**: Custom session-based authentication with password hashing
- **Security**: Scrypt-based password hashing with salt
- **Session Management**: Express-session with PostgreSQL store
- **User Types**: Job seekers, recruiters, clients, and administrators

### User Management
- **Profile System**: Comprehensive user profiles with experience, education, and skills
- **File Uploads**: Resume uploads and profile image handling
- **User Types**: Role-based system supporting multiple user categories

### Company Management
- **Company Profiles**: Complete company information with logo uploads
- **Approval System**: Admin approval workflow for company listings
- **Geographic Data**: Country, state, and city relationship management

### Job Management
- **Job Listings**: Full-featured job posting system
- **Applications**: Job application tracking and management
- **Categories**: Hierarchical job categorization system
- **Search and Filtering**: Advanced job search capabilities

### Networking Features
- **Connections**: Professional networking between users
- **Messaging**: Direct messaging system between connections
- **Groups**: Professional groups and communities

## Data Flow

1. **Client Request**: Frontend sends HTTP requests to Express.js server
2. **Authentication**: Session middleware validates user authentication
3. **Route Handling**: Express routes process requests and validate input
4. **Database Operations**: Drizzle ORM executes type-safe database queries
5. **Response**: JSON responses sent back to client
6. **State Updates**: React Query manages client-side state updates

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL via Neon.tech cloud service
- **ORM**: Drizzle ORM with PostgreSQL driver
- **UI Library**: Radix UI component primitives
- **Validation**: Zod schema validation library
- **Build Tools**: Vite, TypeScript, ESBuild for production builds

### Development Dependencies
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting tools
- **Drizzle Kit**: Database schema management and migrations

## Deployment Strategy

### Development Environment
- **Local Development**: `npm run dev` runs both frontend and backend
- **Hot Reload**: Vite provides fast hot module replacement
- **Database**: Direct connection to Neon.tech PostgreSQL instance

### Production Deployment
- **Build Process**: Vite builds frontend assets, ESBuild bundles backend
- **Static Assets**: Frontend built to `dist/public` directory
- **Server**: Express serves both API and static frontend files
- **Database**: Production PostgreSQL connection with SSL

### Environment Configuration
- **Database URL**: Configurable via environment variables
- **Session Security**: Configurable session secrets and security settings
- **File Storage**: Configurable upload directories and limits

## Changelog

```
Changelog:
- June 13, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```