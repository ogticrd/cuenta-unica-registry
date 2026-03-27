"use client";

import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";

import { LoadingFallback } from "@/components/ui/loading-fallback";
import { useAuth } from "@/lib/auth-context";
import { ROUTES } from "@/lib/constants/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== ROUTES.login) {
      router.push(ROUTES.login);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingFallback />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
