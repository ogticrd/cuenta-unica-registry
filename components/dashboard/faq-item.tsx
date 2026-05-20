"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FAQItemProps {
    question: string;
    answer: string;
    defaultOpen?: boolean;
}

export function FAQItem({
    question,
    answer,
    defaultOpen = false,
}: FAQItemProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-border last:border-0 py-3">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left focus:outline-none group"
                aria-expanded={isOpen}
            >
                <span
                    className={`text-base font-bold transition-colors dark:text-secondary ${isOpen ? "text-secondary dark:text-white" : "text-primary group-hover:text-secondary"} pr-4`}
                >
                    {question}
                </span>
                <div className="flex-shrink-0 ml-2">
                    <ChevronDown
                        size={18}
                        className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                </div>
            </button>
            <div
                className={`grid transition-all duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr] mt-3 opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
                <div className="overflow-hidden">
                    <p className="text-muted-foreground text-sm leading-relaxed pr-8 pb-3">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}