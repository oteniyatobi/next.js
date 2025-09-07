# 🔒 Secure Polling App

A modern, secure polling application built with Next.js, Supabase, and TypeScript. This application has undergone a comprehensive security audit and implements enterprise-grade security measures with extensive documentation for developers.

## 📚 **Documentation Overview**

This codebase includes comprehensive documentation with:
- **JSDoc comments** for all functions and components
- **Inline comments** explaining complex logic and security measures
- **Type definitions** with detailed property descriptions
- **API documentation** with request/response examples
- **Security explanations** for all implemented measures

## 🚀 **Features**

- ✅ **Secure Authentication** - Server-side authentication with email confirmation
- ✅ **Protected Routes** - Middleware-based route protection
- ✅ **Data Authorization** - User ownership verification for all operations
- ✅ **Strong Password Requirements** - Enhanced password security
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **Input Validation** - Comprehensive input sanitization and validation
- ✅ **Modern UI** - Beautiful interface with shadcn/ui components
- ✅ **Real-time Updates** - Live poll updates with Supabase
- ✅ **Responsive Design** - Works on all devices

## 🛡️ **Security Features**

### **Authentication & Authorization**
- Server-side authentication verification
- JWT token validation
- User session management
- Email confirmation required

### **Data Protection**
- User ownership verification
- Encrypted data transmission
- Secure database queries
- Input sanitization

### **Attack Prevention**
- Rate limiting (5 attempts per 15 minutes)
- Brute force protection
- XSS prevention
- SQL injection prevention

### **Password Security**
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers, and special characters
- Client-side and server-side validation

## 🏗️ **Architecture**

```
src/
├── app/
│   ├── api/                 # Secure API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── polls/          # Poll management endpoints
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Protected dashboard
│   └── polls/              # Poll creation and management
├── components/             # Reusable UI components
├── contexts/               # React contexts (Auth)
├── lib/                    # Utilities and validation
└── middleware.ts           # Route protection middleware
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ installed
- Supabase account (free tier available)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd polling-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Go to Settings > API and copy your Project URL and anon key

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. **Set up database schema**
   Run the following SQL in your Supabase SQL editor:
   ```sql
   -- Create polls table
   CREATE TABLE polls (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title VARCHAR(120) NOT NULL,
     description TEXT,
     options TEXT[] NOT NULL,
     allow_multiple BOOLEAN DEFAULT FALSE,
     closes_at TIMESTAMP WITH TIME ZONE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view all polls" ON polls
     FOR SELECT USING (true);

   CREATE POLICY "Users can create polls" ON polls
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own polls" ON polls
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own polls" ON polls
     FOR DELETE USING (auth.uid() = user_id);
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 **Testing**

### **Run Tests**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Test Coverage**
- Unit tests for validation schemas
- Integration tests for authentication
- Component tests for UI interactions
- Security tests for vulnerability prevention

## 🔒 **Security Audit**

This application has undergone a comprehensive security audit that identified and fixed **7 critical vulnerabilities**:

### **Vulnerabilities Fixed**
1. ✅ **Client-Side Authentication Bypass** (CRITICAL)
2. ✅ **No Server-Side Route Protection** (CRITICAL)
3. ✅ **Database Access Without Authorization** (CRITICAL)
4. ✅ **Information Disclosure** (HIGH)
5. ✅ **Weak Password Requirements** (MEDIUM)
6. ✅ **No Rate Limiting** (MEDIUM)
7. ✅ **Environment Variable Exposure** (HIGH)

### **Security Measures Implemented**
- Server-side authentication verification
- Middleware-based route protection
- User ownership verification
- Enhanced password requirements
- Rate limiting and brute force protection
- Input validation and sanitization
- Secure error handling

For detailed security information, see [SECURITY.md](./SECURITY.md).

## 🛠️ **Development**

### **Codebase Structure**

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Server-side)
│   │   ├── auth/verify/         # Authentication verification
│   │   └── polls/               # Poll management endpoints
│   ├── auth/                    # Authentication pages
│   │   ├── login/page.tsx       # Login page
│   │   ├── register/page.tsx    # Registration page
│   │   └── callback/route.ts    # Auth callback handler
│   ├── dashboard/page.tsx       # Protected dashboard
│   └── polls/                   # Poll management
│       ├── NewPollForm.tsx      # Poll creation form
│       ├── page.tsx             # Polls listing
│       └── schemas.ts           # Validation schemas
├── components/                   # Reusable UI components
│   ├── ui/                      # shadcn/ui components
│   ├── LoginForm.tsx            # Login form component
│   └── RegisterForm.tsx         # Registration form component
├── contexts/                     # React Context providers
│   └── AuthContext.tsx          # Authentication context
├── lib/                         # Utility libraries
│   ├── supabase.ts             # Supabase client configuration
│   ├── utils.ts                # General utilities
│   └── validation.ts           # Validation utilities
└── middleware.ts                # Next.js middleware for route protection
```

### **Key Components Documentation**

#### **Authentication System**
- **AuthContext** (`src/contexts/AuthContext.tsx`): Centralized authentication state management
- **Middleware** (`middleware.ts`): Server-side route protection
- **API Routes** (`src/app/api/auth/`): Secure authentication endpoints

#### **Poll Management**
- **NewPollForm** (`src/app/polls/NewPollForm.tsx`): Comprehensive poll creation form
- **Poll Schemas** (`src/app/polls/schemas.ts`): Zod validation schemas
- **Poll API** (`src/app/api/polls/`): Secure poll CRUD operations

#### **Security Features**
- **Server-side Authentication**: All sensitive operations verified on server
- **Input Validation**: Zod schemas for all user inputs
- **Route Protection**: Middleware-based access control
- **Password Security**: Enhanced password requirements

### **Available Scripts**
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm test` - Run Jest test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

### **Code Quality Standards**
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automatic code formatting
- **JSDoc**: Comprehensive function and component documentation
- **Test Coverage**: Unit and integration tests for critical functionality

## 📚 **API Documentation**

### **Authentication Endpoints**

#### `GET /api/auth/verify`
Verify user authentication status.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `GET /auth/callback`
Handle Supabase authentication callback after email confirmation.

**Query Parameters:**
- `code` - Authorization code from Supabase

**Response:** Redirects to `/dashboard` on success

### **Poll Endpoints**

#### `GET /api/polls`
Retrieve all polls for authenticated users.

**Headers:**
- `Cookie` - Authentication session cookie

**Response:**
```json
{
  "polls": [
    {
      "id": "uuid",
      "title": "What should we have for lunch?",
      "description": "Please choose your preferred option",
      "options": ["Pizza", "Burger", "Salad"],
      "allowMultiple": false,
      "closesAt": "2024-12-31T23:59:59Z",
      "created_at": "2024-01-01T00:00:00Z",
      "user_id": "user-uuid"
    }
  ]
}
```

#### `POST /api/polls`
Create a new poll.

**Headers:**
- `Content-Type: application/json`
- `Cookie` - Authentication session cookie

**Request Body:**
```json
{
  "title": "What should we have for lunch?",
  "description": "Please choose your preferred option",
  "options": ["Pizza", "Burger", "Salad"],
  "allowMultiple": false,
  "closesAt": "2024-12-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "poll": {
    "id": "uuid",
    "title": "What should we have for lunch?",
    "description": "Please choose your preferred option",
    "options": ["Pizza", "Burger", "Salad"],
    "allowMultiple": false,
    "closesAt": "2024-12-31T23:59:59Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## 🚀 **Usage Examples**

### **Creating a Poll**

```typescript
// Using the NewPollForm component
import { NewPollForm } from '@/app/polls/NewPollForm'

function CreatePollPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Poll</h1>
      <NewPollForm />
    </div>
  )
}
```

### **Authentication in Components**

```typescript
// Using the authentication context
import { useAuth, useUser } from '@/contexts/AuthContext'

function UserProfile() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>
  
  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### **Form Validation**

```typescript
// Using Zod schemas for validation
import { newPollSchema } from '@/app/polls/schemas'

const pollData = {
  title: "What's your favorite color?",
  description: "Choose from the options below",
  options: ["Red", "Blue", "Green"],
  allowMultiple: false
}

// Validate data
const result = newPollSchema.safeParse(pollData)
if (result.success) {
  console.log('Valid poll data:', result.data)
} else {
  console.error('Validation errors:', result.error.errors)
}
```
- `GET /api/polls/[id]` - Get specific poll (authenticated)
- `DELETE /api/polls/[id]` - Delete poll (owner only)

## 🚀 **Deployment**

### **Environment Variables**
Ensure the following environment variables are set in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **Security Considerations**
- Enable HTTPS in production
- Set up proper CORS policies
- Configure rate limiting at the server level
- Monitor for suspicious activity
- Regular security updates

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### **Security Guidelines**
- Never commit sensitive information
- Follow secure coding practices
- Add security tests for new features
- Review code for security vulnerabilities

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For security-related issues or questions:
- Create an issue in the repository
- Contact the development team
- Review the security documentation

## 🔄 **Changelog**

### **v1.0.0** - Security Release
- ✅ Comprehensive security audit completed
- ✅ All critical vulnerabilities fixed
- ✅ Enhanced authentication and authorization
- ✅ Rate limiting and brute force protection
- ✅ Input validation and sanitization
- ✅ Production-ready security measures

---

**⚠️ Security Notice**: This application has been thoroughly audited and secured. However, security is an ongoing process. Please report any security concerns immediately.

**🔒 Security Status**: ✅ SECURE - Production Ready