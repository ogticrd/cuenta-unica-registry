import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ContactItem } from "@/components/dashboard/contact-item"
import { FAQItem } from "@/components/dashboard/faq-item"
import { Phone, Mail, Clock, MapPin, ExternalLink, HelpCircle } from "lucide-react"

export default function SupportPage() {
  const faqs = [
    {
      question: "¿Cómo inicio sesión en mi Cuenta Única Ciudadana?",
      answer:
        "Para iniciar sesión en tu Cuenta Única Ciudadana, dirígete a la página de inicio de sesión e ingresa tu cédula de identidad o correo electrónico registrado junto con tu contraseña. Si es tu primera vez, deberás crear una cuenta primero.",
      defaultOpen: true,
    },
    {
      question: "Olvidé mi contraseña, ¿cómo la recupero?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      defaultOpen: false,
    },
    {
      question: "¿Qué servicios puedo acceder con mi Cuenta Única?",
      answer:
        "Con tu Cuenta Unica Ciudadana puedes acceder a todos los servicios digitales del gobierno dominicano, incluyendo consultas de estado, verificacion de identidad, y acceso a los portales de las instituciones gubernamentales.",
      defaultOpen: false,
    },
    {
      question: "¿Cómo actualizo mis datos personales?",
      answer:
        "Puedes actualizar tus datos personales accediendo a la sección 'Datos personales' en tu panel de usuario. Allí podrás modificar tu información de contacto, dirección y otros datos relevantes.",
      defaultOpen: false,
    },
    {
      question: "¿Es segura mi información en la plataforma?",
      answer:
        "Sí, tu información está protegida con los más altos estándares de seguridad. Utilizamos encriptación de datos y medidas de protección avanzadas para garantizar la privacidad y seguridad de tu información personal.",
      defaultOpen: false,
    },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        {/* Header Section */}
        <div className="pt-4 pb-8 border-b dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">Soporte y Contacto</h1>
            <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 p-2 rounded-full">
              <HelpCircle size={24} />
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            ¿Tienes dudas o necesitas ayuda con tu <span className="text-secondary dark:text-blue-400 font-bold">Cuenta Única Ciudadana</span>?
            Estamos aquí para ayudarte y asegurar que tu experiencia sea rápida y segura.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-blue-400 mb-6">Canales de Atención</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ContactItem icon={<Phone size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Teléfono principal</span>
                  <span className="font-bold text-foreground text-lg tracking-tight">809-123-4567</span>
                </div>
              </ContactItem>

              <ContactItem icon={<Mail size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Correo electrónico</span>
                  <span className="font-medium text-foreground">soporte@cuentaciudadana.gob.do</span>
                </div>
              </ContactItem>

              <ContactItem icon={<Clock size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Horario de atención</span>
                  <span className="font-medium text-foreground">Lunes a Viernes, 8:00 a.m. - 5:00 p.m.</span>
                </div>
              </ContactItem>

              <ContactItem icon={<MapPin size={20} className="text-blue-600 dark:text-blue-400" />}>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Oficina Central</span>
                  <span className="font-medium text-foreground leading-relaxed">
                    Av. Rómulo Betancourt #311, edificio corporativo vista 311, Santo Domingo, D.N.
                  </span>
                </div>
              </ContactItem>
            </div>
          </div>

          {/* FAQs */}
          <div className="pt-8 border-t dark:border-border">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-primary dark:text-blue-400">Preguntas Frecuentes</h2>
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
                Ver tutoriales en video
                <ExternalLink size={14} className="ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
