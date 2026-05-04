import { createContext, PropsWithChildren, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, logoutApi } from "../api";
import { Local_Storage_Keys } from "../constants";
import { AuthContextType, UserResponse } from "../types";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

type AuthProviderProps = {} & PropsWithChildren;

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const storedUserId = localStorage.getItem(Local_Storage_Keys.userId);
  const storedUsername = localStorage.getItem(Local_Storage_Keys.username);

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user", storedUserId],
    enabled: !!storedUserId,
    queryFn: () => getUser(storedUserId!),
    placeholderData:
      storedUserId && storedUsername
        ? ({
            userId: storedUserId,
            username: storedUsername,
          } as unknown as UserResponse)
        : undefined,
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
      isAuthenticated: !!user && !isError,
      isLoading,
      logout,
    }),
    [user, isLoading, isError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
