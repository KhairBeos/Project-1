import { Route, Routes, Navigate, useLocation } from "react-router";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import BlockedUsersPage from "./pages/BlockedUsersPage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import FriendRequestsPage from "./pages/FriendRequestsPage.jsx";
import GroupsPage from "./pages/GroupsPage.jsx";
import GroupDetailPage from "./pages/GroupDetailPage.jsx";
import UserSearchPage from "./pages/UserSearchPage.jsx";
import ChatHistoryPage from "./pages/ChatHistoryPage.jsx";
import DirectChatPage from "./pages/DirectChatPage.jsx";
import TwoFAPage from "./pages/TwoFAPage.jsx";
import ForgotPasswordOTPFlowPage from "./pages/ForgotPasswordOTPFlowPage.jsx";

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
          element={
            !isAuthenticated ? (
              <SignUpPage />
            ) : !isEmailVerified ? (
              <Navigate to="/verify-email" />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" />
            ) : (
              <Navigate to="/chat" />
            )
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : !isEmailVerified ? (
              <Navigate to="/verify-email" />
            ) : !isOnboarded ? (
              <Navigate to="/onboarding" />
            ) : (
              <Navigate to="/chat" />
            )
          }
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
        <Route
          path="/profile"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <ProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/change-password"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <ChangePasswordPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/blocked-users"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <BlockedUsersPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/friends"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <FriendsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/friend-requests"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <FriendRequestsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/groups"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <GroupsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/groups/:id"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <GroupDetailPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/user-search"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <UserSearchPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/chat-history"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <ChatHistoryPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/direct/:id"
          element={
            isAuthenticated && isEmailVerified && isOnboarded ? (
              <DirectChatPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/2fa" element={<TwoFAPage />} />
        <Route
          path="/forgot-password-otp"
          element={<ForgotPasswordOTPFlowPage />}
        />
        <Route
          path="*"
          element={<ErrorPage message="404 - Trang không tồn tại!" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
