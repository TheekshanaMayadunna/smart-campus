<<<<<<< Updated upstream
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
=======
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiClient } from './api/apiClient';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import LoginPage from "./pages/LoginPage";
import ResourcesPage from "./pages/resources/ResourcesPage";
import ResourceDetailsPage from "./pages/resources/ResourceDetailsPage";
import BookingsPage from "./pages/BookingsPage";
import TicketsPage from "./pages/MaintenanceAndTickets/TicketsPage";
import TicketDetailPage from "./pages/MaintenanceAndTickets/TicketDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ManageUsersPage from "./pages/ManageUsersPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LandingPage from "./pages/LandingPage";
import PublicInfoPage from "./pages/PublicInfoPage";
import AppLoader from "./components/common/AppLoader";
import AssetProfilePage from "./pages/resourceInspections/AssetProfilePage";
import InspectionHistoryPage from "./pages/resourceInspections/InspectionHistoryPage";
import OverdueInspectionsPage from "./pages/resourceInspections/OverdueInspectionsPage";
import QrLookupPage from "./pages/resourceInspections/QrLookupPage";

const AUTH_HEADER_STORAGE_KEY = "sum_auth_header";
const THEME_STORAGE_KEY = "sum_theme";

function AppRoutes({ user, onLogin, onLogout, onProfileUpdate, theme, onToggleTheme }) {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(false);
  const firstRender = useRef(true);
  const isAuthenticated = Boolean(user);
  const isTechnician = user?.role === "TECHNICIAN";

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (routeLoading) {
    return <AppLoader label="Loading page..." variant="fullscreen" />;
  }

  const renderProtected = (element) =>
    isAuthenticated ? element : <Navigate to="/" replace />;
  const renderNonTechnicianProtected = (element) =>
    !isAuthenticated ? <Navigate to="/" replace /> : isTechnician ? <Navigate to="/tickets" replace /> : element;

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && isTechnician ? (
              <Navigate to="/tickets" replace />
            ) : (
              <LandingPage user={user} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
            )
          }
        />
        <Route
          path="/about"
          element={isAuthenticated ? <Navigate to="/" replace /> : <PublicInfoPage pageKey="about" theme={theme} onToggleTheme={onToggleTheme} />}
        />
        <Route
          path="/features"
          element={isAuthenticated ? <Navigate to="/" replace /> : <PublicInfoPage pageKey="features" theme={theme} onToggleTheme={onToggleTheme} />}
        />
        <Route
          path="/contact"
          element={isAuthenticated ? <Navigate to="/" replace /> : <PublicInfoPage pageKey="contact" theme={theme} onToggleTheme={onToggleTheme} />}
        />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={onLogin} initialMode="login" />
            )
          }
        />

        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={onLogin} initialMode="signup" />
            )
          }
        />

        <Route
          path="/admin"
          element={
            !isAuthenticated ? (
              <Navigate to="/" replace />
            ) : user?.role === "ADMIN" ? (
              <AdminDashboardPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/resources"
          element={renderNonTechnicianProtected(<ResourcesPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/resources/:id"
          element={renderNonTechnicianProtected(<ResourceDetailsPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/resources/:id/asset-profile"
          element={renderNonTechnicianProtected(<AssetProfilePage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/resources/:id/inspection-history"
          element={renderNonTechnicianProtected(<InspectionHistoryPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/resource-inspections/overdue"
          element={renderNonTechnicianProtected(<OverdueInspectionsPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/resource-assets/qr"
          element={renderNonTechnicianProtected(<QrLookupPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/bookings"
          element={renderNonTechnicianProtected(<BookingsPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/tickets"
          element={renderProtected(<TicketsPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/tickets/:id"
          element={renderProtected(<TicketDetailPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/notifications"
          element={renderProtected(<NotificationsPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />)}
        />
        <Route
          path="/profile"
          element={renderNonTechnicianProtected(
            <ProfilePage onLogout={onLogout} user={user} onProfileUpdate={onProfileUpdate} theme={theme} onToggleTheme={onToggleTheme} />
          )}
        />
        <Route
          path="/settings"
          element={
            !isAuthenticated ? (
              <Navigate to="/" replace />
            ) : user?.role === "ADMIN" ? (
              <SettingsPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/manage-users"
          element={
            !isAuthenticated ? (
              <Navigate to="/" replace />
            ) : user?.role === "ADMIN" ? (
              <ManageUsersPage onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "light");

  useEffect(() => {
    const savedAuthHeader = localStorage.getItem(AUTH_HEADER_STORAGE_KEY);
    if (savedAuthHeader) {
      axios.defaults.headers.common["Authorization"] = savedAuthHeader;
      apiClient.defaults.headers.common["Authorization"] = savedAuthHeader;
    }

    // Check if the user is already logged in via session (OAuth2)
    const checkUser = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        // Not logged in or session expired; clear stale basic auth header if any.
        localStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
        delete axios.defaults.headers.common['Authorization'];
        delete apiClient.defaults.headers.common['Authorization'];
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Server-side logout failed or session already expired", err);
    }
    setUser(null);
    localStorage.removeItem(AUTH_HEADER_STORAGE_KEY);
    delete axios.defaults.headers.common['Authorization'];
    delete apiClient.defaults.headers.common['Authorization'];
  };

  if (checkingAuth) {
    return <AppLoader label="Loading session..." variant="fullscreen" />;
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes
        user={user}
        onLogin={(userData) => setUser(userData)}
        onLogout={handleLogout}
        onProfileUpdate={(updatedUser) => setUser(updatedUser)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    </BrowserRouter>
  );
}
>>>>>>> Stashed changes
