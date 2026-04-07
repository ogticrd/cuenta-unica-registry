import clsx from "clsx";

export type TermNode =
  | { type: "h2"; text: string; className?: string }
  | { type: "h3"; text: string; className?: string }
  | { type: "h4"; text: string; className?: string }
  | { type: "p"; text: string; className?: string }
  | {
      type: "ul";
      items: string[];
      listType?: "none" | "disc";
      className?: string;
    };

export type TermSection =
  | {
      type: "section";
      spacing?: "3" | "4";
      items: TermNode[];
    }
  | {
      type: "hr";
    };

export type TermsData = TermSection[];

interface TermsContentProps {
  data: TermsData;
}

export function TermsContent({ data }: TermsContentProps) {
  return (
    <div className="space-y-6 text-sm text-muted-foreground dark:text-slate-300 leading-relaxed text-justify">
      {data.map((section, _, sectionArray) => {
        const sectionIdx = sectionArray.indexOf(section);
        if (section.type === "hr") {
          return (
            <hr
              key={`hr-${sectionIdx}`}
              className="border-border dark:border-slate-800 my-8"
            />
          );
        }

        return (
          <section
            key={`section-${sectionIdx}`}
            className={section.spacing === "4" ? "space-y-4" : "space-y-3"}
          >
            {section.items.map((item, __, itemArray) => {
              const itemIdx = itemArray.indexOf(item);
              if (item.type === "h2") {
                return (
                  <h2
                    key={`h2-${itemIdx}`}
                    className={clsx(
                      "text-lg font-bold text-primary dark:text-blue-300",
                      item.className,
                    )}
                  >
                    {item.text}
                  </h2>
                );
              }
              if (item.type === "h3") {
                return (
                  <h3
                    key={`h3-${itemIdx}`}
                    className={clsx(
                      "text-base font-bold text-primary dark:text-blue-300",
                      item.className,
                    )}
                  >
                    {item.text}
                  </h3>
                );
              }
              if (item.type === "h4") {
                return (
                  <h4
                    key={`h4-${itemIdx}`}
                    className={clsx(
                      "font-bold text-primary dark:text-blue-300",
                      item.className,
                    )}
                  >
                    {item.text}
                  </h4>
                );
              }
              if (item.type === "p") {
                return (
                  <p key={`p-${itemIdx}`} className={item.className}>
                    {item.text}
                  </p>
                );
              }
              if (item.type === "ul") {
                return (
                  <ul
                    key={`ul-${itemIdx}`}
                    className={clsx(
                      item.listType === "disc"
                        ? "list-disc pl-6"
                        : "list-none pl-4",
                      "space-y-2",
                      item.className,
                    )}
                  >
                    {item.items.map((li, ___, liArray) => (
                      <li key={`li-${liArray.indexOf(li)}`}>{li}</li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
          </section>
        );
      })}
    </div>
  );
}
