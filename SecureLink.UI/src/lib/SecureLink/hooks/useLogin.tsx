import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api";
import { Local_Storage_Keys } from "../constants";

export const useLogin = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      localStorage.setItem(Local_Storage_Keys.accessToken, data.accessToken);
      localStorage.setItem(Local_Storage_Keys.refreshToken, data.refreshToken);
      localStorage.setItem(Local_Storage_Keys.userId, data.userId);
      localStorage.setItem(Local_Storage_Keys.username, data.username);

      navigate("/dashboard");
    },
    onError: (error) => {
      //logging for now
      console.error("Login Failed", error);
    },
  });
};
