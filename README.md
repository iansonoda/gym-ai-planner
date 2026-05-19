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
- Auth: Express sessions with Passport.js, Google OAuth, and GitHub OAuth
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

3. Create `.env` in the project root:

```env
VITE_API_URL="http://localhost:3001"
```

4. Create `server/.env`:

```env
DATABASE_URL="postgresql://gymai:gymai@localhost:5432/gymai"
SESSION_SECRET="replace-with-a-long-random-string"
APP_ORIGIN="http://localhost:5173"
API_BASE_URL="http://localhost:3001"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
OPEN_ROUTER_KEY="your-openrouter-key"
PORT=3001
```

5. Start the app:

```bash
npm run start:app
```

This starts Docker Postgres, runs Prisma setup, starts the backend, and starts Vite. Use `Ctrl+C` to stop both dev servers.

If you already ran setup and only want the dev servers:

```bash
npm run start:app -- --skip-setup
```

Manual setup is also available:

```bash
docker compose up -d postgres
npm run db:generate --prefix server
npm run db:migrate --prefix server
```

6. Manual server start:

```bash
cd server
npm run dev:server
cd ..
```

```bash
npm run dev
```

The frontend runs through Vite and the backend serves the API used for profile storage and plan generation.

In development, the sign-in page includes a dev login button that creates a local session without Google or GitHub credentials. It is disabled when `NODE_ENV=production`.

## Testing

Run the full test suite:

```bash
npm test
```

Run only unit or integration coverage:

```bash
npm run test:unit
npm run test:integration
```

Generate coverage or metrics summaries:

```bash
npm run test:coverage
npm run test:metrics
```

`npm run test:metrics` writes machine-readable output to `test-results/vitest-report.json` and `test-results/metrics-summary.json`, including scenario counts, input-combination counts, plan-generation route outcomes, and local mocked response-time measurements.

## Why I Built It

As a new graduate, I wanted a project that showed more than isolated coding exercises. GymAI let me demonstrate product thinking, full-stack development, database design, API integration, authentication flows, and frontend polish in one application.
