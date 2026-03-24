"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type React from "react";

import { LoadingFallback } from "@/components/ui/loading-fallback";
import { ROUTES } from "@/lib/constants/routes";
import { useAuth } from "@/lib/auth-context";

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
  }, [user, isLoading, router]);

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
