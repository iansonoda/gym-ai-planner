# 🏋️‍♂️ Gym AI Planner

A modern, AI-powered workout companion designed to help you reach your fitness goals with precision. Gym AI Planner takes the guesswork out of training by generating personalized workout routines based on your unique profile, equipment, and experience.

---

## ✨ Features

- **🎯 Personalized Onboarding**: A comprehensive onboarding flow to understand your goals, experience level (Beginner to Advanced), and physical constraints.
- **🤖 AI-Driven Plan Generation**: Uses OpenRouter (AI) to craft custom training splits (Full Body, PPL, Upper/Lower, etc.) tailored specifically to your needs.
- **📊 Detailed Workout Views**: Beautifully rendered exercise tables including sets, reps, rest periods, and RPE (Rate of Perceived Exertion).
- **📈 Progression Strategies**: Custom-tailored advice on how to progress your lifts over time based on your goals.
- **🛠 Equipment Awareness**: Specify available equipment (Commercial Gym, Home Gym, Bodyweight only) to ensure your plan is actionable.
- **🌱 Injuries & Preferences**: Accounts for past injuries and preferred training styles to keep you safe and motivated.
- **🔄 Plan Versioning**: Automatically tracks and stores different versions of your training plans as you evolve and regenerate them.
- **🎨 Modern UI**: Built with a sleek, premium design system using Tailwind CSS 4 and Shadcn UI.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js 5](https://expressjs.com/)
- **ORM**: [Prisma 7](https://www.prisma.io/)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/)
- **AI Integration**: [OpenRouter API](https://openrouter.ai/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A PostgreSQL database (e.g., [Neon.tech](https://neon.tech/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/iansonoda/gym-ai-planner.git
   cd gym-ai-planner
   ```

2. **Setup the Backend**:
   ```bash
   cd server
   npm install
   ```

3. **Configure Server Environment**:
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   OPEN_ROUTER_KEY="your-openrouter-key"
   PORT=3001
   ```

4. **Initialize Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Setup the Frontend**:
   ```bash
   cd ..
   npm install
   ```

6. **Configure Frontend Environment**:
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL="http://localhost:3001"
   ```

7. **Run the Application**:
   - Start the backend: `cd server && npm run dev:server`
   - Start the frontend: `npm run dev`

---

## 📁 Project Structure

```text
├── src/                # Frontend React application
│   ├── components/     # Reusable UI components (PlanDisplay, UI primitives)
│   ├── pages/          # Application views (Onboarding, Profile, Auth)
│   ├── context/        # Auth and Global State
│   ├── lib/            # API client and helper functions
│   └── types/          # Shared type definitions
├── server/             # Express.js backend
│   ├── prisma/         # Database schema and client generation
│   ├── src/            # Backend logic, routes, and AI generation
│   └── types/          # Backend-specific types
├── public/             # Static public assets
└── package.json        # Frontend dependencies and scripts
```

---

## 📄 License

This project is licensed under the MIT License.
