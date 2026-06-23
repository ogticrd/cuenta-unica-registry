"use client";

import { Search } from "lucide-react";
import type * as React from "react";

interface SearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function FAQSearch({
  onSearch,
  placeholder = "Buscar...",
}: SearchProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <div className="relative w-full shadow-sm rounded-md overflow-hidden border border-border dark:border-slate-800 bg-white dark:bg-card">
      <div className="flex items-center px-4 py-3">
        <Search className="w-5 h-5 text-muted-foreground mr-3" />
        <input
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-foreground font-medium placeholder:text-muted-foreground/50"
          placeholder={placeholder}
          onChange={handleChange}
          aria-label="search"
        />
      </div>
    </div>
  );
}
