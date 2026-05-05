import {
  createContext,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, logoutApi } from "../api";
import { Local_Storage_Keys } from "../constants";
import { AuthContextType } from "../types";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

type AuthProviderProps = {} & PropsWithChildren;

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const [storedUserId, setStoredUserId] = useState<string | null>(
    localStorage.getItem(Local_Storage_Keys.userId),
  );

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user", storedUserId],
    enabled: !!storedUserId,
    queryFn: () => getUser(storedUserId!),
    staleTime: Infinity,
  });

  const logout = useCallback(
    async (refreshToken: string) => {
      try {
        await logoutApi({ refreshToken });
      } finally {
        localStorage.clear();
        queryClient.clear();
        window.location.href = "/login";
      }
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!storedUserId && !isError,
      isLoading,
      logout,
      setStoredUserId,
    }),
    [user, isLoading, isError, logout, storedUserId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
