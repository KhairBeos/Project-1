import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "../lib/api.js";

const useSignup = (onSuccess, onError) => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      if (onSuccess) onSuccess(data);
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });

  return { signupMutation: mutate, isPending, error };
};

export default useSignup;
