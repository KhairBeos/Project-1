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
