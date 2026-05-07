import { useMutation } from "@tanstack/react-query";
import { registerApi } from "../api";

export const useRegister = () => {
  return useMutation({
    mutationFn: registerApi,
    onError: (error) => {
      //logging for now
      console.error("Sign Up Failed", error);
    },
  });
};
