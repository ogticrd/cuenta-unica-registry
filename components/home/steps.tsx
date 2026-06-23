import { useT } from "@/hooks/use-t";
import { Backlight } from "../ui/backlight";

export function Steps() {
  const t = useT("landing.steps");

  const stepsData = [
    {
      number: "1",
      title: t("step1_title"),
      items: [t("step1_item1")],
    },
    {
      number: "2",
      title: t("step2_title"),
      items: [t("step2_item1"), t("step2_item2")],
    },
    {
      number: "3",
      title: t("step3_title"),
      items: [t("step3_item1")],
    },
    {
      number: "4",
      title: t("step4_title"),
      items: [t("step4_item1")],
    },
    {
      number: "5",
      title: t("step5_title"),
      items: [t("step5_item1")],
      isLast: true,
    },
  ];

  return (
    <section className="relative py-24 bg-primary dark:bg-card overflow-hidden text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="text-[#6db0e2]">{chunks}</span>
              ),
            })}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          {/* Left Column - Vertical Timeline */}
          <div className="w-full lg:w-1/2 relative">
            {/* Vertical Line connecting steps */}
            <div className="absolute left-[1.15rem] top-12 bottom-12 w-0.5 bg-white/20"></div>

            <div className="space-y-12">
              {stepsData.map((step) => (
                <div key={step.number} className="relative flex gap-6">
                  {/* Number Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                        ${step.isLast ? "bg-[#EE2A24] text-white" : "bg-[#6db0e2] text-primary"}`}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-1">
                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <ul className="space-y-2">
                      {step.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-gray-200 text-[15px] leading-relaxed"
                        >
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-white flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Video */}
          <div className="w-full lg:w-1/2 relative flex items-center justify-center mt-12 lg:mt-0">
            <Backlight blur={50} className="w-full">
              <div className="w-full aspect-video rounded-md overflow-hidden relative z-20 bg-black/20">
                <iframe
                  className="w-full h-full absolute inset-0"
                  src="https://www.youtube.com/embed/b22bZZOSDjg?si=nCjvc4Z5TTddv91a"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </Backlight>
          </div>
        </div>
      </div>
    </section>
  );
}
