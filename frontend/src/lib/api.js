import { axiosInstance } from "./axios.js";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const getAuthUser = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axiosInstance.put("/auth/update-profile", profileData);
  return response.data;
};

export const onboard = async (onboardData) => {
  const response = await axiosInstance.post("/auth/onboarding", onboardData);
  return response.data;
};

export const resendVerificationEmail = async () => {
  const response = await axiosInstance.post("/auth/resend-verification");
  return response.data;
};

export const verifyEmail = async (code) => {
  const response = await axiosInstance.post("/auth/verify-email", { code });
  return response.data;
};

export const logout = async () => {
  await axiosInstance.post("/auth/logout");
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const sendResetPasswordEmail = async (email) => {
  const response = await axiosInstance.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await axiosInstance.post("/auth/reset-password", {
    token,
    password,
  });
  return response.data;
};

export const verify2FALogin = async ({ account, token }) => {
  const response = await axiosInstance.post("/twofa/verify-login", {
    account,
    token,
  });
  return response.data;
};

export const sendForgotPasswordCode = async (account) => {
  const response = await axiosInstance.post("/auth/forgot-password", {
    account,
  });
  return response.data;
};

export const verifyForgotPasswordCode = async ({ email, code }) => {
  const response = await axiosInstance.post("/auth/forgot-password/verify", {
    email,
    code,
  });
  return response.data;
};

export const resetPasswordWithCode = async ({ email, newPassword }) => {
  const response = await axiosInstance.post("/auth/forgot-password/reset", {
    email,
    newPassword,
  });
  return response.data;
};
