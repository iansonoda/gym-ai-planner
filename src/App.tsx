import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import Home from "./pages/Home"
import Auth from "./pages/Auth"
import Account from "./pages/Account"
import Onboarding from "./pages/Onboarding"
import Profile from "./pages/Profile"
import Navbar from "./components/layout/Navbar"
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import { authClient } from "./lib/auth";
import AuthProvider from "./context/AuthContext";
import { trackEvent } from "./lib/analytics";

function RouteMetadata() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;

    let title = "GymAI";

    if (pathname === "/") {
      title = "GymAI";
    } else if (pathname === "/auth/sign-in") {
      title = "Sign In | GymAI";
    } else if (pathname === "/auth/sign-up") {
      title = "Sign Up | GymAI";
    } else if (pathname === "/profile") {
      title = "My Plan | GymAI";
    } else if (pathname === "/onboarding") {
      title = "Build Your Plan | GymAI";
    } else if (pathname.startsWith("/account/")) {
      title = "Account | GymAI";
    } else {
      title = "GymAI";
    }

    document.title = title;
    trackEvent({
      eventName: "page_view",
      path: pathname,
      properties: {
        title,
      },
    });
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    document.body.style.backgroundColor = "var(--color-background)";
    document.body.style.color = "var(--color-foreground)";
  }, []);

  return (
    <NeonAuthUIProvider authClient={authClient} defaultTheme="dark">
      <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <RouteMetadata />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route index element={<Home />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth/:pathname" element={<Auth />} />
              <Route path="/account/:pathname" element={<Account />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      </AuthProvider>
    </NeonAuthUIProvider>
  )
}

export default App
