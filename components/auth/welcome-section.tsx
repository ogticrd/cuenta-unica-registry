import Image from "next/image"

export function WelcomeSection() {
  return (
    <div className="flex flex-col justify-center space-y-6 text-left">
      <div className="space-y-4">
        <h1 className="text-3xl lg:text-4xl font-medium text-primary leading-tight">
          ¡Bienvenido a la Plataforma Única de Autenticación <span className="text-accent font-bold">Ciudadana</span>!
        </h1>

        <p className="text-lg text-primary font-medium leading-relaxed">
          Accede o registrate con un unico usuario y contrasena, para consultar todos los servicios gubernamentales disponibles.
        </p>

        <p className="text-base text-gray-600 leading-relaxed">
          Una manera facil y comoda de identificarte, para acceder a los servicios del Estado desde tu computadora o celular sin
          necesidad de trasladarte a los organismos gubernamentales.
        </p>
      </div>

      <div className="flex justify-center lg:justify-start">
        <div className="relative w-full max-w-lg">
          <Image
            src="/images/digital-authentication-illustration.png"
            alt="Ilustración de acceso digital seguro a servicios gubernamentales"
            width={500}
            height={400}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </div>
  )
}
