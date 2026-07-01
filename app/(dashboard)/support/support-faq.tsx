"use client";

import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import {
  FAQAccordion,
  type FAQData,
} from "@/components/home/faq/faq-accordion";
import { FAQSearch } from "@/components/home/faq/faq-search";

interface SupportFAQProps {
  questions: FAQData[];
  helpImagesText: string;
  searchPlaceholder: string;
  noResultsText: string;
}

export function SupportFAQ({
  questions,
  helpImagesText,
  searchPlaceholder,
  noResultsText,
}: SupportFAQProps) {
  const [filteredQuestions, setFilteredQuestions] =
    useState<FAQData[]>(questions);

  const fuse = useMemo(
    () =>
      new Fuse(questions, {
        keys: ["question", "answer"],
        threshold: 0.35,
        ignoreLocation: true,
        ignoreDiacritics: true,
      }),
    [questions],
  );

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredQuestions(questions);
      return;
    }

    const results = fuse.search(query);
    setFilteredQuestions(results.map((r) => r.item));
  };

  return (
    <div className="flex flex-col space-y-6">
      <FAQSearch onSearch={handleSearch} placeholder={searchPlaceholder} />

      {filteredQuestions.length > 0 ? (
        <FAQAccordion
          questions={filteredQuestions}
          helpImagesText={helpImagesText}
        />
      ) : (
        <div className="text-center py-12 bg-white dark:bg-card rounded-md border border-border dark:border-slate-800 shadow-sm">
          <p className="text-muted-foreground text-lg">{noResultsText}</p>
        </div>
      )}
    </div>
  );
}
