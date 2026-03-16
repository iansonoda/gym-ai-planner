# 🏋️‍♂️ Gym AI Planner

A modern, AI-powered workout companion designed to help you reach your fitness goals with precision. Gym AI Planner takes the guesswork out of training by generating personalized workout routines based on your unique profile, equipment, and experience.

---

## ✨ Features

- **🎯 Personalized Onboarding**: A comprehensive onboarding flow to understand your goals, experience level (Beginner to Advanced), and physical constraints.
- **🤖 AI-Driven Plan Generation**: Uses advanced AI to craft custom training splits (Full Body, PPL, Upper/Lower, etc.) tailored specifically to your needs.
- **🛠 Equipment Awareness**: Specify available equipment (Commercial Gym, Home Gym, Bodyweight only) to ensure your plan is actionable.
- **🌱 Injuries & Preferences**: Accounts for past injuries and preferred training styles to keep you safe and motivated.
- **🔄 Plan Versioning**: Automatically tracks and stores different versions of your training plans as you evolve and regenerate them.
- **🎨 Modern, Responsive UI**: Built with a sleek, premium design system using Tailwind CSS 4 and Shadcn UI.

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
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A PostgreSQL database (e.g., [Neon.tech](https://neon.tech/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/gym-ai-planner.git
   cd gym-ai-planner
   ```

2. **Setup the Server**:
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   AI_API_KEY="your-ai-provider-api-key"
   PORT=3000
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

6. **Run the Application**:
   - Start the backend: `cd server && npm run dev`
   - Start the frontend: `npm run dev`

---

## 📁 Project Structure

```text
├── src/                # Frontend React application
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application views (Onboarding, Home, Profile)
│   ├── lib/            # Utility functions
│   └── assets/         # Static assets
├── server/             # Express.js backend
│   ├── prisma/         # Database schema and migrations
│   ├── src/            # Backend logic and routes
│   └── types/          # Shared type definitions
├── public/             # Static public assets
└── package.json        # Project dependencies and scripts
```

---

## 📄 License

This project is licensed under the MIT License.
