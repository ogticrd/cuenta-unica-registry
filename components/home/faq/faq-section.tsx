"use client";

import Fuse from "fuse.js";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/hooks/use-t";
import faqsEn from "./data/faqs-en.json";
import faqsEs from "./data/faqs-es.json";
import { FAQAccordion, type FAQData } from "./faq-accordion";
import { FAQSearch } from "./faq-search";

export function FAQSection() {
  const t = useTranslations("landing.faq");
  const locale = useLocale();

  const [questions, setQuestions] = useState<FAQData[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<FAQData[]>([]);

  useEffect(() => {
    // Load local JSON data based on locale
    const data = locale === "es" ? faqsEs : faqsEn;
    setQuestions(data as FAQData[]);
    setFilteredQuestions(data as FAQData[]);
  }, [locale]);

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
    <section className="py-20 sm:py-24 bg-[#eff7ff] dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-start">
          {/* Left Column: Title and Subtitle */}
          <div className="md:col-span-4 text-left">
            <h2 className="text-primary text-[2rem] sm:text-[2.5rem] lg:text-[3rem] font-black leading-snug tracking-tight dark:text-white">
              {t("title")}
            </h2>
            <p className="text-[#6db0e2] text-lg">{t("subtitle")}</p>
          </div>

          {/* Right Column: Search and Accordion */}
          <div className="md:col-span-8 flex flex-col space-y-8">
            <FAQSearch
              onSearch={handleSearch}
              placeholder={t("search_placeholder")}
            />

            {filteredQuestions.length > 0 ? (
              <FAQAccordion
                questions={filteredQuestions}
                helpImagesText={t("help_images")}
              />
            ) : (
              <div className="text-center py-12 bg-white dark:bg-card rounded-md border border-border dark:border-slate-800 shadow-sm">
                <p className="text-muted-foreground text-lg">
                  {t("no_results")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
