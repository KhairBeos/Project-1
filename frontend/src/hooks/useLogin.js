import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../lib/api.js";

const useLogin = (onSuccess) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      if (onSuccess) onSuccess(data);
    },
  });

  return { error, isPending, loginMutation: mutate };
};

export default useLogin;
