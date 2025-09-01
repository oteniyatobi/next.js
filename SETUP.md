# Polling App Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier available)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Once created, go to Settings > API
   - Copy your Project URL and anon/public key

3. Create environment file:
   Create a `.env.local` file in the root directory with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features Implemented

- ✅ User authentication (login/register)
- ✅ Supabase integration
- ✅ Protected dashboard route
- ✅ Modern UI with shadcn/ui components
- ✅ Responsive design
- ✅ Form validation and error handling

## Next Steps

- Create polls functionality
- Add voting mechanisms
- Implement real-time updates
- Add user profiles

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── contexts/
│   └── AuthContext.tsx
└── lib/
    ├── supabase.ts
    └── utils.ts
```
