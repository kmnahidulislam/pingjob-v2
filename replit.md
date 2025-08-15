# PingJob - Job Board and Professional Networking Platform

## Overview
PingJob is a comprehensive full-stack web application designed to serve as a job board and professional networking platform. It facilitates user authentication, company management, job listings, and professional profiles. The platform aims to connect job seekers with opportunities and enable professional networking, featuring robust search capabilities, application tracking, and secure user management. The business vision is to become a leading platform for professional connections and job placements, with significant market potential in the online recruitment space.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI with Tailwind CSS for styling and theming. The design emphasizes clean, intuitive interfaces with consistent branding (e.g., LinkedIn blue for mobile) and a focus on readability and professional presentation.
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
- **Primary Database**: PostgreSQL
- **Session Management**: PostgreSQL
- **File Storage**: Local filesystem

### Key Features
- **Authentication System**: Supports multiple user types (job seekers, recruiters, clients, administrators), password hashing, and session persistence. Includes Google OAuth for sign-in.
- **User Management**: Comprehensive profiles with resume/profile image uploads, education, experience, and skills.
- **Company Management**: Company profiles with logo uploads and admin approval workflow, including geographic data.
- **Job Management**: Job posting, application tracking, hierarchical categorization, advanced search/filtering, and intelligent location parsing.
- **Networking Features**: Professional connections, direct messaging, and groups.
- **Resume Parsing & Scoring**: Intelligent job-resume matching with skills-weighted scoring.
- **Mobile App**: Cross-platform mobile development using Capacitor (Android and iOS) with mobile-optimized CSS and native features.
- **Admin Features**: Dashboard for user, company, and job management, including pending approvals, traffic analytics, and manual candidate assignment.
- **Recruiter Features**: Dedicated dashboard for job management, candidate auto-assignment based on category, and communication tools.
- **Social Media Integration**: Automatic posting of job listings.

### Design Principles
- **UI/UX**: Clean, intuitive interfaces with consistent branding, readability, and professional presentation.
- **Performance**: Optimized builds, efficient database queries, and aggressive caching strategies.
- **Security**: Comprehensive security measures including Helmet middleware, rate limiting, input validation, MIME type checks, and strong password policies.
- **Scalability**: Designed for cloud deployment with flexible port configuration and health checks.

## External Dependencies
- **Database**: PostgreSQL (Neon.tech)
- **ORM**: Drizzle ORM
- **UI Libraries**: Radix UI, Tailwind CSS
- **Validation**: Zod
- **Build Tools**: Vite, TypeScript
- **File Uploads**: Multer
- **Password Hashing**: Scrypt
- **Session Management**: Express-session, connect-pg-simple
- **Email Service**: SendGrid
- **Analytics**: Google Analytics 4
- **Advertising**: Google AdSense
- **Authentication**: Google OAuth
- **Mobile Development**: Capacitor
- **Social Media APIs**: Facebook, Twitter/X, Instagram