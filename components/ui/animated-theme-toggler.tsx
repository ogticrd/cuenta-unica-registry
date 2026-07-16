"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export const AnimatedThemeToggler = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button">) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className={cn("p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400",
          className)}
        {...props}
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400",
        className,
      )}
      {...props}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
