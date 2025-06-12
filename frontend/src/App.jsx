import { Route, Routes, Navigate, useLocation } from "react-router";
import { CSSTransition, SwitchTransition } from "react-transition-group";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
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
import Layout from "./components/Layout.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useToast } from "./components/Toast.jsx";

const App = () => {
  const location = useLocation();
  const { ToastContainer } = useToast();

  const { isLoading, authUser, error } = useAuthUser();

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;
  const isEmailVerified = authUser?.isEmailVerified;
  const isTwoFAEnabled = authUser?.twoFactorEnabled;
  const isTwoFAVerified = authUser?.isTwoFAVerified; // Nếu có trạng thái này trong backend/frontend

  // Chỉ loading khi không ở signup/login
  if (!["/signup", "/login"].includes(location.pathname)) {
    if (isLoading) return <PageLoader />;
    if (error)
      return <ErrorPage message={error?.message || "Something went wrong!"} />;
  }

  return (
    <ErrorBoundary>
      <div className="h-screen" data-theme="night ">
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={location.pathname}
            classNames="fade"
            timeout={200}
          >
            <div>
              <Routes location={location}>
                {/* Route có layout */}
                <Route element={<Layout />}>
                  <Route
                    path="/"
                    element={
                      isAuthenticated ? (
                        !isEmailVerified ? (
                          <Navigate to="/verify-email" />
                        ) : !isOnboarded ? (
                          <Navigate to="/onboarding" />
                        ) : isTwoFAEnabled && !isTwoFAVerified ? (
                          <Navigate to="/2fa" />
                        ) : (
                          <HomePage />
                        )
                      ) : (
                        <Navigate to="/login" />
                      )
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      isAuthenticated && isEmailVerified && isOnboarded ? (
                        isTwoFAEnabled && !isTwoFAVerified ? (
                          <Navigate to="/2fa" />
                        ) : (
                          <ChatPage />
                        )
                      ) : (
                        <Navigate to="/login" />
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
                </Route>
                {/* Route không có layout */}
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
                  path="/2fa"
                  element={
                    isAuthenticated && isEmailVerified ? (
                      <TwoFAPage />
                    ) : !isAuthenticated ? (
                      <Navigate to="/login" />
                    ) : (
                      <Navigate to="/verify-email" />
                    )
                  }
                />
                <Route
                  path="/forgot-password-otp"
                  element={<ForgotPasswordOTPFlowPage />}
                />
                <Route
                  path="*"
                  element={<ErrorPage message="404 - Trang không tồn tại!" />}
                />
              </Routes>
            </div>
          </CSSTransition>
        </SwitchTransition>
        <Toaster />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
};

export default App;

// Thêm CSS cho hiệu ứng fade
if (!document.getElementById("page-fade-style")) {
  const style = document.createElement("style");
  style.id = "page-fade-style";
  style.textContent = `
    .fade-enter {
      opacity: 0;
    }
    .fade-enter-active {
      opacity: 1;
      transition: opacity 200ms;
    }
    .fade-exit {
      opacity: 1;
    }
    .fade-exit-active {
      opacity: 0;
      transition: opacity 200ms;
    }
  `;
  document.head.appendChild(style);
}
