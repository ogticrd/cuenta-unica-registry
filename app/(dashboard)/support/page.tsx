import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ContactItem } from "@/components/dashboard/contact-item"
import { FAQItem } from "@/components/dashboard/faq-item"
import { Phone, Mail, Clock, MapPin, ExternalLink, HelpCircle } from "lucide-react"
import { getT } from "@/lib/i18n/server"

export default async function SupportPage() {
  const t = await getT("support")
  const faqs = [
    {
      question: t("faqs_list.q1.q"),
      answer: t("faqs_list.q1.a"),
      defaultOpen: true,
    },
    {
      question: t("faqs_list.q2.q"),
      answer: t("faqs_list.q2.a"),
      defaultOpen: false,
    },
    {
      question: t("faqs_list.q3.q"),
      answer: t("faqs_list.q3.a"),
      defaultOpen: false,
    },
    {
      question: t("faqs_list.q4.q"),
      answer: t("faqs_list.q4.a"),
      defaultOpen: false,
    },
    {
      question: t("faqs_list.q5.q"),
      answer: t("faqs_list.q5.a"),
      defaultOpen: false,
    },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        {/* Header Section */}
        <div className="pt-4 pb-8 border-b dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">{t("title")}</h1>
            <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 p-2 rounded-full">
              <HelpCircle size={24} />
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-blue-400 mb-6">{t("channels_title")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ContactItem icon={<Phone size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">{t("contact.phone_label")}</span>
                  <span className="font-bold text-foreground text-lg tracking-tight">809-123-4567</span>
                </div>
              </ContactItem>

              <ContactItem icon={<Mail size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">{t("contact.email_label")}</span>
                  <span className="font-medium text-foreground">soporte@cuentaciudadana.gob.do</span>
                </div>
              </ContactItem>

              <ContactItem icon={<Clock size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">{t("contact.hours_label")}</span>
                  <span className="font-medium text-foreground">{t("contact.hours_value")}</span>
                </div>
              </ContactItem>

              <ContactItem icon={<MapPin size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">{t("contact.office_label")}</span>
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
              <h2 className="text-xl font-bold text-primary dark:text-blue-400">{t("faqs_title")}</h2>
              <span className="text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 px-3 py-1 rounded-full">FAQ</span>
            </div>
            <div className="space-y-1">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  defaultOpen={faq.defaultOpen}
                />
              ))}
            </div>

            {/* Quick Link Optional */}
            <div className="mt-8 text-center pt-4">
              <button className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                {t("video_tutorials")}
                <ExternalLink size={14} className="ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
