# GymAI

GymAI is a full-stack web application that generates personalized workout plans based on a user's goals, experience level, schedule, equipment, and training constraints. I built this project to practice shipping a polished product end to end, including AI plan generation, authentication, persistent user data, and a responsive frontend.

## Preview

![GymAI home page](./src/assets/readme-hero.png)

![GymAI sign up flow](./src/assets/readme-signup.png)

![GymAI profile view](./src/assets/readme-profile.png)

![GymAI weekly plan view 1](./src/assets/readme-plan1.png)

![GymAI weekly plan view 2](./src/assets/readme-plan2.png)

## What It Does

- Collects onboarding data about training goals, experience, schedule, preferred split, and equipment
- Generates AI-based workout plans with sets, reps, rest times, focus areas, and progression guidance
- Saves user profiles and plan versions so plans can be revisited and regenerated
- Provides authenticated flows for sign up, sign in, account management, and plan review

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS 4
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma
- Auth: Neon Auth
- AI: OpenRouter

## Local Setup

1. Clone the repository and install frontend dependencies:

```bash
git clone https://github.com/iansonoda/gym-ai-planner.git
cd gym-ai-planner
npm install
```

2. Install backend dependencies:

```bash
cd server
npm install
cd ..
```

3. Create `server/.env`:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
OPEN_ROUTER_KEY="your-openrouter-key"
PORT=3001
```

4. Create `.env` in the project root:

```env
VITE_API_URL="http://localhost:3001"
```

5. Initialize the database:

```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

6. Start the app:

```bash
cd server
npm run dev:server
cd ..
```

```bash
npm run dev
```

The frontend runs through Vite and the backend serves the API used for profile storage and plan generation.

## Why I Built It

As a new graduate, I wanted a project that showed more than isolated coding exercises. GymAI let me demonstrate product thinking, full-stack development, database design, API integration, authentication flows, and frontend polish in one application.
