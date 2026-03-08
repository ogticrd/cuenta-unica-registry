import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ContactItem } from "@/components/dashboard/contact-item"
import { FAQItem } from "@/components/dashboard/faq-item"
import { Phone, Mail, Clock, MapPin } from "lucide-react"

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
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-primary mb-8">Información de contacto</h1>

        <div>
          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              ¿Tienes dudas o necesitas ayuda con su{" "}
              <span className="text-accent font-bold">Cuenta Única Ciudadana</span>? Contáctanos por correo o
              teléfono. ¡Estamos aquí para ayudarte y asegurar que su experiencia sea rápida y segura!
            </p>
          </div>

          <div className="space-y-6">
            <ContactItem icon={<Phone size={20} className="text-primary" />}>
              <div className="font-bold">809-123-4567</div>
            </ContactItem>

            <ContactItem icon={<Mail size={20} className="text-primary" />}>
              <div className="font-bold">soporte@cuentaciudadana.gob.do</div>
            </ContactItem>

            <ContactItem icon={<Clock size={20} className="text-primary" />}>
              <div className="font-bold">Lunes a Viernes, 8:00 a.m. - 5:00 p.m.</div>
            </ContactItem>

            <ContactItem icon={<MapPin size={20} className="text-primary" />}>
              <div className="font-bold">
                Av. Rómulo Betancourt #311, edificio corporativo vista 311, Santo Domingo, República Dominicana.
              </div>
            </ContactItem>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-primary mb-6">
            Preguntas frecuentes <span className="text-accent">(FAQs)</span>
          </h2>

          <div className="space-y-0">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={`${index + 1}. ${faq.question}`}
                answer={faq.answer}
                defaultOpen={faq.defaultOpen}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
