import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api";

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: registerApi,
    onError: (error) => {
      //logging for now
      console.error("Sign Up Failed", error);
    },
  });
};
