# Email/Password Authentication Implementation Plan

## Research Summary

### Current State Analysis

**Database Schema Status:**
- ✅ Database has correct schema with `password` column in `users` table
- ✅ All required columns exist: id, email, password, first_name, last_name, user_type
- ✅ Neon PostgreSQL database is properly connected and accessible

**Authentication Files Present:**
- `server/auth.ts` - Main authentication setup using Drizzle ORM
- `server/simple-working-auth.ts` - Alternative implementation with direct SQL
- `server/working-auth.ts` - Session-based authentication
- `server/override-auth.ts` - Override implementation
- `server/direct-auth.ts` - Direct database connection approach
- `client/src/hooks/use-auth.tsx` - React Query-based authentication hook
- `client/src/pages/auth-page.tsx` - Login/registration UI

**Current Issues Identified:**

1. **Schema Mismatch Problem**: The primary issue is that Drizzle ORM is generating SQL that references a "password" column, but the database connection pool used by the application cannot find this column, despite it existing when queried directly.

2. **Multiple Authentication Implementations**: There are 5+ different authentication files causing conflicts and confusion about which system is active.

3. **Route Registration Order**: Authentication routes must be registered before Vite middleware to prevent HTML responses instead of JSON.

4. **Database Pool Isolation**: The application's database pool appears to be connecting to a different schema or database instance than direct SQL queries.

### Root Cause Analysis

The core issue is **database connection pool inconsistency**. While direct SQL queries through the execute_sql_tool can access the users table with the password column, the application's Drizzle ORM connection cannot find the same column. This suggests:

- Schema synchronization issues between Drizzle and actual database
- Connection pool pointing to different database instances
- Cached schema information in Drizzle conflicting with actual database structure

## Implementation Plan

### Phase 1: Clean Up Conflicting Files (CRITICAL)

**Remove Conflicting Authentication Files:**
- Delete `server/working-auth.ts`
- Delete `server/simple-working-auth.ts` 
- Delete `server/override-auth.ts`
- Delete `server/direct-auth.ts`
- Keep only `server/auth.ts` as the single source of truth

**Consolidate Route Registration:**
- Ensure `server/routes.ts` only imports and calls `setupAuth` from `server/auth.ts`
- Remove any duplicate authentication route definitions

### Phase 2: Fix Database Connection Issues (HIGH PRIORITY)

**Option A: Force Schema Sync (Recommended)**
```bash
# Push Drizzle schema to database to ensure consistency
npm run db:push --force
```

**Option B: Direct SQL Bypass**
- Modify `server/storage.ts` to use raw SQL queries instead of Drizzle ORM for user operations
- This bypasses the schema mismatch issue while maintaining functionality

**Option C: Database Pool Reset**
- Clear any cached connections in the database pool
- Reinitialize the Drizzle connection with explicit schema mapping

### Phase 3: Implement Working Authentication System

**Core Authentication Flow:**
1. **Registration Endpoint** (`POST /api/register`)
   - Validate email uniqueness
   - Hash password using scrypt with salt
   - Store user in database
   - Create session
   - Return user data

2. **Login Endpoint** (`POST /api/login`)
   - Find user by email
   - Verify password hash
   - Create session
   - Return user data

3. **User Status Endpoint** (`GET /api/user`)
   - Check session for authenticated user
   - Return user data or 401

4. **Logout Endpoint** (`POST /api/logout`)
   - Destroy session
   - Return success status

**Session Management:**
- Use express-session with MemoryStore for development
- Configure secure session cookies
- Set appropriate session timeout (24 hours)

### Phase 4: Frontend Integration

**Authentication Hook Updates:**
- Ensure `useAuth` hook properly handles all authentication states
- Implement proper error handling and user feedback
- Add loading states for all authentication operations

**Protected Routes:**
- Verify `ProtectedRoute` component redirects unauthenticated users
- Ensure proper loading states during authentication checks

**UI Components:**
- Test login/registration forms work correctly
- Verify form validation and error display
- Ensure proper user type selection

### Phase 5: Testing and Validation

**Backend Testing:**
```bash
# Test registration
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User","userType":"job_seeker"}'

# Test login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Test user status
curl -X GET http://localhost:5000/api/user -b cookies.txt

# Test logout
curl -X POST http://localhost:5000/api/logout -b cookies.txt
```

**Frontend Testing:**
- Test complete registration flow through UI
- Test login flow through UI  
- Test protected route access
- Test logout functionality
- Verify session persistence across page refreshes

## Immediate Action Steps

### Step 1: Clean Up (5 minutes)
```bash
rm server/working-auth.ts
rm server/simple-working-auth.ts  
rm server/override-auth.ts
rm server/direct-auth.ts
```

### Step 2: Fix Database Schema (10 minutes)
```bash
npm run db:push --force
```

### Step 3: Update Storage Layer (15 minutes)
- Modify `server/storage.ts` to use raw SQL for user operations
- Test user creation with direct SQL queries

### Step 4: Test Authentication (10 minutes)
- Test registration endpoint
- Test login endpoint  
- Verify session management

### Step 5: Frontend Testing (10 minutes)
- Test complete user registration flow
- Test login and logout through UI
- Verify protected routes work correctly

## Expected Outcomes

After implementing this plan:

1. **Single Authentication System**: Only one auth implementation will remain active
2. **Working Registration**: Users can create accounts with email/password
3. **Working Login**: Users can authenticate with their credentials  
4. **Session Management**: Users stay logged in across page refreshes
5. **Protected Routes**: Unauthenticated users are redirected to login
6. **Proper Error Handling**: Clear error messages for authentication failures

## Potential Risks and Mitigations

**Risk**: Database schema push fails due to data conflicts
**Mitigation**: Use `--force` flag or manually drop/recreate conflicting tables

**Risk**: Session storage issues in production
**Mitigation**: Plan to migrate from MemoryStore to database-backed sessions for production

**Risk**: Password security concerns  
**Mitigation**: Using industry-standard scrypt hashing with salt

**Risk**: Frontend state management issues
**Mitigation**: React Query handles caching and synchronization automatically

This plan addresses the core database connection issues while providing a clear path to a fully functional email/password authentication system.