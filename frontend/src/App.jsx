import { Route, Routes, Navigate, useLocation } from "react-router";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";

import { Toaster } from "react-hot-toast";
import PageLoader from "./components/PageLoader.jsx";
import ErrorPage from "./components/ErrorPage.jsx";
import useAuthUser from "./hooks/useAuthUser.js";

const App = () => {
  const location = useLocation();

  const { isLoading, authUser, error } = useAuthUser();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;
  const isEmailVerified = authUser?.isEmailVerified;

  // Chỉ loading khi không ở signup/login
  if (!["/signup", "/login"].includes(location.pathname)) {
    if (isLoading) return <PageLoader />;
    if (error)
      return <ErrorPage message={error?.message || "Something went wrong!"} />;
  }

  return (
    <div className="h-screen" data-theme="night ">
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              !isEmailVerified ? (
                <Navigate to="/verify-email" />
              ) : !isOnboarded ? (
                <Navigate to="/onboarding" />
              ) : (
                <HomePage />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/signup"
          element={!isAuthenticated ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <NotificationsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <ChatPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/call"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <CallPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/onboarding"
          element={
            isAuthenticated && isEmailVerified && !isOnboarded ? (
              <OnboardingPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/verify-email"
          element={
            isAuthenticated && !isEmailVerified ? (
              <EmailVerificationPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
