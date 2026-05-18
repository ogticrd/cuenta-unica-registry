"use client"

import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import DotField from "@/components/home/hero/DotField"
import {
  Shield,
  Clock,
  UserCheck,
  Fingerprint,
  ArrowRight,
  CheckCircle,
  Building2,
  HelpCircle,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ArrowUpRight
} from "lucide-react"
import { useState } from "react"
import { ROUTES } from "@/lib/constants/routes"

// FAQ Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/30 bg-primary/5' : 'border-gray-200 bg-white'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-primary text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  )
}

// Benefit Card Component
function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

export default function LandingPage() {
  const benefits = [
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "Acceso Sencillo",
      description: "Usa tu numero de cédula para acceder a los servicios digitales del Estado, sin recordar múltiples correos o contraseñas."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Ahorro de Tiempo",
      description: "Ya no necesitarás crear cuentas para cada servicio. Con tu Cuenta Única, accede a todos los servicios del Estado."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Mayor Seguridad",
      description: "Nadie podrá suplantar tu identidad. Además, puedes habilitar autenticación de múltiples factores."
    },
    {
      icon: <Fingerprint className="w-6 h-6" />,
      title: "Verificación Sencilla",
      description: "Verifica tu identidad mostrando tu rostro a la cámara. El sistema compara tus rasgos con la foto de tu cédula."
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Verificación de identidad",
      description: "Ingresa tu numero de cédula y realiza la prueba de vida ante la JCE"
    },
    {
      number: "02",
      title: "Creación de cuenta",
      description: "Crea una contraseña segura y única para proteger tu cuenta"
    },
    {
      number: "03",
      title: "Confirmación",
      description: "Proporciona un correo electrónico e ingresa el código de verificación"
    },
    {
      number: "04",
      title: "Listo!",
      description: "Tu cuenta está lista para usar en portales gubernamentales"
    }
  ]

  const faqs = [
    {
      question: "¿Qué es la Cuenta Única Ciudadana?",
      answer: "Es el nuevo mecanismo con el que te podrás identificar ante los portales y aplicaciones del Estado Dominicano. Tu número de cédula de identidad y electoral será tu identificador siempre."
    },
    {
      question: "¿Cómo puedo registrarme?",
      answer: "El proceso de registro es muy sencillo. Solo necesitas tu cédula de identidad, acceso a una cámara para la verificación facial, y un correo electrónico para confirmar tu cuenta."
    },
    {
      question: "¿Es seguro usar la Cuenta Única Ciudadana?",
      answer: "Sí, la plataforma cuenta con los más altos estándares de seguridad. Además, puedes habilitar la autenticación de dos factores y configurar passkeys para mayor protección."
    },
    {
      question: "¿Qué servicios puedo acceder con mi cuenta?",
      answer: "Puedes acceder a todos los servicios digitales del gobierno dominicano que estén integrados con la plataforma. La lista de servicios disponibles crece constantemente."
    },
    {
      question: "¿Qué hago si olvidé mi contraseña?",
      answer: "Puedes recuperar tu contraseña fácilmente a través del enlace 'Olvidé mi contraseña' en la página de inicio de sesión. Recibirás un código de verificación en tu correo electrónico."
    },
    {
      question: "¿Cómo puedo actualizar mis datos personales?",
      answer: "Los datos personales provienen de los registros oficiales del Estado (JCE, TSS, DGII). Para actualizarlos, debes dirigirte a la institución correspondiente y solicitar la modificación."
    }
  ]

  const stats = [
    { value: "5M+", label: "Usuarios" },
    { value: "50+", label: "Instituciones" },
    { value: "99.9%", label: "Disponibilidad" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Modern Clean Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-white h-[100dvh]">
        {/* DotField Background */}
        <div className="absolute inset-0 w-full h-full opacity-40">
          <DotField
            dotRadius={2}
            dotSpacing={14}
            bulgeStrength={67}
            glowRadius={160}
            sparkle={true}
            waveAmplitude={10}
            cursorRadius={500}
            cursorForce={0.1}
            bulgeOnly
            gradientFrom="#A855F7"
            gradientTo="#B497CF"
            glowColor="#0087ff"
          />
        </div>
        {/* Subtle background pattern */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32 h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              {/* Badge */}

              <h1 className="text-5xl sm:text-4xl lg:text-6xl font-bold leading-[2.2] text-primary mb-6">
                ¡Bienvenid@ al servicio de
                <span className="text-accent"> Cuenta Única Ciudadana!</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Una manera fácil y segura de identificarte en los portales y aplicaciones del estado dominicano, para realizar trámites desde tu computadora o celular sin necesidad de trasladarte a los organismos gubernamentales.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={ROUTES.register}>
                  <Button
                    className="w-full h-12 text-base font-semibold rounded-full bg-primary hover:bg-[#002f5c] dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                  >
                    Crear mi cuenta
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href={ROUTES.login}>
                  <Button variant="outline" className="w-full h-12 text-base font-semibold rounded-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-primary px-8 py-6">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8 mt-10 pt-10 border-t border-gray-100">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex justify-center">
              <div className="relative">
                {/* Decorative elements */}
                <Image
                  src="/images/hero.svg"
                  alt="Autenticación Digital"
                  width={450}
                  height={360}
                  className="w-full max-w-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Cuenta Única Section */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Beneficios</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-5">
              ¿Por qué usar Cuenta Única?
            </h2>
            <p className="text-gray-600 text-lg">
              El mecanismo oficial para identificarte ante los portales y aplicaciones del Estado Dominicano.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section - Modern Timeline Design */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Proceso</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-5">
              Regístrate en 4 simples pasos
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Crea tu cuenta en minutos y comienza a acceder a los servicios del Estado.
            </p>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-12 left-0 right-0 h-0.5 bg-gray-200"></div>
              <div className="absolute top-12 left-0 w-1/2 h-0.5 bg-primary"></div>

              <div className="grid grid-cols-4 gap-6">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    {/* Step Number Circle */}
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-6 border-4 transition-all ${index <= 1 ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200'}`}>
                      {step.number}
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                      <p className="text-gray-500 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Steps */}
          <div className="lg:hidden space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 rounded-xl p-5">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Government Entities Section - Modern Card Design */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Content */}
              <div className="p-8 sm:p-12 lg:p-16">
                <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2 mb-6">
                  <Building2 className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">Para Instituciones</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Integra tu portal con Cuenta Única
                </h2>

                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  La integración ofrece un inicio de sesión simple y seguro, reduce vectores de ataques
                  como la suplantación de identidad y creación de multicuentas.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    "Estándares OAuth y OpenID Connect",
                    "Documentación completa para desarrolladores",
                    "Soporte técnico dedicado"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link href="mailto:info@ogtic.gob.do">
                  <Button className="bg-primary text-white hover:bg-primary/90 px-6 py-5 font-semibold group">
                    Solicitar Informacion
                    <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Stats Side */}
              <div className="bg-primary p-8 sm:p-12 lg:p-16 flex items-center">
                <div className="grid grid-cols-2 gap-6 w-full">
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center text-white">
                    <div className="text-4xl font-bold mb-1">5M+</div>
                    <div className="text-sm text-blue-100">Usuarios Registrados</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center text-white">
                    <div className="text-4xl font-bold mb-1">50+</div>
                    <div className="text-sm text-blue-100">Instituciones</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center text-white">
                    <div className="text-4xl font-bold mb-1">99.9%</div>
                    <div className="text-sm text-blue-100">Disponibilidad</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center text-white">
                    <div className="text-4xl font-bold mb-1">24/7</div>
                    <div className="text-sm text-blue-100">Soporte Técnico</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <HelpCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-gray-600 text-lg">
              Respuestas a las consultas más comunes sobre la plataforma.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
