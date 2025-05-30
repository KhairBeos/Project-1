import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/api.js";
import { useLocation } from "react-router-dom";
const useAuthUser = () => {
  const location = useLocation();
  const authUser = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
    enabled: !["/signup", "/login"].includes(location.pathname), // Không gọi khi ở signup/login
  });

  return {
    authUser: authUser.data?.user,
    isLoading: authUser.isLoading,
    error: authUser.error,
  };
};

export default useAuthUser;
