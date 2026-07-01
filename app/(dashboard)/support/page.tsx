import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { ContactItem } from "@/components/dashboard/contact-item";
import { getCurrentLocale, getT } from "@/lib/i18n/server";
import faqsEn from "@/components/home/faq/data/faqs-en.json";
import faqsEs from "@/components/home/faq/data/faqs-es.json";
import { SupportFAQ } from "./support-faq";
import { type FAQData } from "@/components/home/faq/faq-accordion";

export default async function SupportPage() {
  const t = await getT("support");
  const tLanding = await getT("landing.faq");
  const locale = await getCurrentLocale();
  const rawFaqs = locale === "es" ? faqsEs : faqsEn;
  const faqs = rawFaqs as FAQData[];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4 pb-8 border-b dark:border-border">
        <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-12">
        {/* Contact Info */}
        <div>
          <h2 className="text-xl font-bold text-primary dark:text-blue-400 mb-6">
            {t("channels_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ContactItem
              icon={
                <Phone size={20} className="text-blue-600 dark:text-blue-400" />
              }
            >
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1">
                  {t("contact.phone_label")}
                </span>
                <span className="text-foreground text-lg tracking-tight">
                  809-286-1009
                </span>
              </div>
            </ContactItem>

            <ContactItem
              icon={
                <Mail size={20} className="text-blue-600 dark:text-blue-400" />
              }
            >
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1">
                  {t("contact.email_label")}
                </span>
                <span className="font-medium text-foreground">
                  soporte@cuentaciudadana.gob.do
                </span>
              </div>
            </ContactItem>

            <ContactItem
              icon={
                <Clock size={20} className="text-blue-600 dark:text-blue-400" />
              }
            >
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1">
                  {t("contact.hours_label")}
                </span>
                <span className="font-medium text-foreground">
                  {t("contact.hours_value")}
                </span>
              </div>
            </ContactItem>

            <ContactItem
              icon={
                <MapPin
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                />
              }
            >
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground mb-1">
                  {t("contact.office_label")}
                </span>
                <span className="font-medium text-foreground leading-relaxed">
                  {t("contact.office_value")}
                </span>
              </div>
            </ContactItem>
          </div>
        </div>

        {/* FAQs */}
        <div className="pt-8 border-t dark:border-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-primary dark:text-blue-400">
              {t("faqs_title")}
            </h2>
            <span className="text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              FAQ
            </span>
          </div>
          <div className="mt-6">
            <SupportFAQ
              questions={faqs}
              helpImagesText={tLanding("help_images")}
              searchPlaceholder={tLanding("search_placeholder")}
              noResultsText={tLanding("no_results")}
            />
          </div>

          {/* Quick Link Optional */}
          <div className="mt-8 text-center pt-4">
            <button
              type="button"
              className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t("video_tutorials")}
              <ExternalLink size={14} className="ml-1.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
