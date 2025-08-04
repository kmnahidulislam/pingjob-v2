# PingJob - Job Board and Professional Networking Platform

## Overview
PingJob is a comprehensive full-stack web application designed to serve as a job board and professional networking platform. It facilitates user authentication, company management, job listings, and professional profiles. The platform aims to connect job seekers with opportunities and enable professional networking, featuring robust search capabilities, application tracking, and secure user management.

## Recent Updates (August 2025)
✅ **Login System Fully Operational** - Fixed critical authentication issues with Passport.js session handling
✅ **Session Persistence Working** - Users can now successfully log in and maintain authenticated state
✅ **Navigation Fixed** - Home page login buttons properly redirect to authentication page (/auth)
✅ **Job Creation Working** - Admin can successfully create and edit job postings with proper authentication
✅ **Vendor Count Display Fixed** - Companies with 0 vendors no longer show "0", display is hidden when count is zero
⚠️ **Facebook Integration Pending** - System ready for Facebook posting but requires token with `pages_manage_posts` and `pages_read_engagement` permissions

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI with Tailwind CSS for styling and theming
- **State Management**: React Query (TanStack Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Client-side routing

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful APIs and session-based authentication
- **Database ORM**: Drizzle ORM for type-safe operations
- **Session Storage**: PostgreSQL-based session management (`connect-pg-simple`)
- **File Uploads**: Multer middleware
- **Authentication**: Custom session-based with Scrypt hashing
- **File Storage**: Local filesystem (`/uploads`)

### Data Storage
- **Primary Database**: PostgreSQL (hosted on Neon.tech)
- **Session Management**: PostgreSQL
- **File Storage**: Local filesystem

### Key Features
- **Authentication System**: Supports multiple user types (job seekers, recruiters, clients, administrators), password hashing, and session persistence.
- **User Management**: Comprehensive profiles with resume/profile image uploads, education, experience, and skills. Supports Google OAuth for sign-in.
- **Company Management**: Company profiles with logo uploads and admin approval workflow. Includes geographic data.
- **Job Management**: Job posting, application tracking, hierarchical categorization, and advanced search/filtering. Includes auto-application to category-matched jobs.
- **Networking Features**: Professional connections, direct messaging, and groups.
- **Resume Parsing & Scoring**: Intelligent job-resume matching with skills-weighted scoring.
- **Mobile App**: Cross-platform mobile development using Capacitor (Android and iOS) with mobile-optimized CSS and native features.
- **Admin Features**: Dashboard for user, company, and job management, including pending approvals and traffic analytics (admin-only).
- **Recruiter Features**: Dedicated dashboard for job management, candidate auto-assignment based on category, and communication tools.
- **Social Media Integration**: Automatic posting of job listings to Facebook, Twitter, and Instagram.

### Design Principles
- **UI/UX**: Focus on clean, intuitive interfaces with consistent branding (e.g., LinkedIn blue for mobile). Emphasis on readability and professional presentation.
- **Performance**: Optimized builds with Vite, efficient database queries, and aggressive caching strategies. Rate limiting to prevent abuse.
- **Security**: Comprehensive security measures including Helmet middleware, rate limiting, input validation, MIME type checks, and strong password policies.
- **Scalability**: Designed for cloud deployment with flexible port configuration and health checks.

## External Dependencies
- **Database**: PostgreSQL (Neon.tech)
- **ORM**: Drizzle ORM
- **UI Libraries**: Radix UI, Tailwind CSS
- **Validation**: Zod
- **Build Tools**: Vite, TypeScript, ESBuild
- **File Uploads**: Multer
- **Password Hashing**: Scrypt
- **Session Management**: Express-session, connect-pg-simple
- **Email Service**: SendGrid (for invitations)
- **Analytics**: Google Analytics 4
- **Advertising**: Google AdSense
- **Authentication**: Google OAuth
- **Mobile Development**: Capacitor (for Android, iOS)
- **Social Media APIs**: Facebook, Twitter/X, Instagram