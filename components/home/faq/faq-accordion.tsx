"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export interface FAQData {
  id: number;
  question: string;
  answer: string;
  images?: string[];
}

interface AccordionProps {
  questions: FAQData[];
  helpImagesText: string;
}

function isSafeHref(value: string | null) {
  return value?.startsWith("https://") || value?.startsWith("http://");
}

function renderTrustedAnswer(html: string) {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, "");
  }

  const document = new DOMParser().parseFromString(html, "text/html");

  function renderNodes(nodes: NodeListOf<ChildNode>, keyPrefix: string) {
    return Array.from(nodes).map((node, index) =>
      renderNode(node, `${keyPrefix}-${index}`),
    );
  }

  function renderNode(node: ChildNode, key: string): React.ReactNode {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (!(node instanceof Element)) {
      return null;
    }

    const children = renderNodes(node.childNodes, key);

    switch (node.tagName.toLowerCase()) {
      case "p":
        return <p key={key}>{children}</p>;
      case "ol":
        return <ol key={key}>{children}</ol>;
      case "li":
        return <li key={key}>{children}</li>;
      case "strong":
        return <strong key={key}>{children}</strong>;
      case "br":
        return <br key={key} />;
      case "a": {
        const href = node.getAttribute("href");

        if (!isSafeHref(href)) {
          return <React.Fragment key={key}>{children}</React.Fragment>;
        }

        return (
          <a
            href={href ?? undefined}
            key={key}
            rel="noopener noreferrer"
            target="_blank"
          >
            {children}
          </a>
        );
      }
      default:
        return <React.Fragment key={key}>{children}</React.Fragment>;
    }
  }

  return renderNodes(document.body.childNodes, "answer");
}

export function FAQAccordion({ questions, helpImagesText }: AccordionProps) {
  const [openStates, setOpenStates] = React.useState<Record<number, boolean>>(
    {},
  );
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [slides, setSlides] = React.useState<{ src: string }[]>([]);

  const toggleAccordion = (id: number) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenLightbox = (images: string[]) => {
    setSlides(images.map((src) => ({ src })));
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {questions.map((item) => {
          const isOpen = openStates[item.id] || false;
          return (
            <div
              key={item.id}
              className={`border rounded-md overflow-hidden transition-all duration-300 ${
                isOpen
                  ? "border-secondary bg-white dark:bg-primary/10"
                  : "border-border bg-white dark:bg-card dark:border-slate-800"
              } shadow-sm`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(item.id)}
                className="w-full px-6 py-5 text-left flex items-center justify-between rounded-none hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-primary pr-4 dark:text-white">
                  {item.question}
                </span>
                <div
                  className={`w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    <div>{renderTrustedAnswer(item.answer)}</div>

                    {item.images && item.images.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-border dark:border-slate-800">
                        <p className="text-sm font-medium text-foreground mb-3">
                          {helpImagesText}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {item.images.map((img, index) => (
                            <button
                              key={img}
                              type="button"
                              onClick={() =>
                                handleOpenLightbox(item.images || [])
                              }
                              className="relative w-32 h-20 rounded-md overflow-hidden border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:opacity-90 transition-opacity"
                            >
                              <Image
                                src={img}
                                alt={`Ayuda paso ${index + 1}`}
                                fill
                                className="object-cover !m-0"
                                sizes="128px"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
      />
    </>
  );
}
