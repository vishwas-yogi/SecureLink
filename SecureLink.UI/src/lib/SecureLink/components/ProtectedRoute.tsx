import { PropsWithChildren } from "react";
import { useAuth } from "../hooks";
import { Navigate } from "react-router-dom";

type ProtectedRoutesProps = {} & PropsWithChildren;

export const ProtectedRoute = ({ children }: ProtectedRoutesProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <p>Loading...</p>;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
