import Image from "next/image"
import Link from "next/link"
import { Facebook, Youtube, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <>
      <footer className="bg-primary text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Government Logo Section */}
            <div className="flex flex-col space-y-3">
              <Image
                src="/images/government-seal.png"
                alt="Escudo República Dominicana"
                width={180}
                height={180}
                className="filter brightness-0 invert"
              />
            </div>

            {/* CONÓCENOS */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">CONÓCENOS</h4>
              <p className="text-xs leading-relaxed">
                Oficina Gubernamental de Tecnologías de la Información y Comunicación
              </p>
            </div>

            {/* CONTÁCTANOS */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">CONTÁCTANOS</h4>
              <div className="space-y-1 text-xs">
                <p>Tel: (809)-286-1009</p>
                <p>Fax: (809)-732-5465</p>
                <p>info@ogtic.gob.do</p>
              </div>
            </div>

            {/* BÚSCANOS */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">BÚSCANOS</h4>
              <div className="text-xs leading-relaxed">
                <p>Av. 27 de Febrero #419 casi esquina Núñez de Cáceres, Santo Domingo, R.D.</p>
              </div>
            </div>

            {/* INFÓRMATE */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">INFÓRMATE</h4>
              <div className="space-y-1 text-xs">
                <Link href="/terms" className="block hover:underline">
                  Términos de Uso
                </Link>
                <Link href="/privacy" className="block hover:underline">
                  Política de Privacidad
                </Link>
                <Link href="/faq" className="block hover:underline">
                  Preguntas Frecuentes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <div className="bg-white">
        <div className="container mx-auto p-4 bg-white">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <p className="text-xs text-primary">© 2025 Todos los Derechos Reservados. Desarrollado por</p>
              <Image src="/images/ogtic-logo.png" alt="OGTIC" width={60} height={20} />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-primary font-medium">SÍGUENOS</span>
              <div className="flex space-x-2">
                <Link href="#" className="text-primary hover:text-primary transition-colors">
                  <Facebook size={16} />
                </Link>
                <Link href="#" className="text-primary hover:text-primary transition-colors">
                  <Youtube size={16} />
                </Link>
                <Link href="#" className="text-primary hover:text-primary transition-colors">
                  <Twitter size={16} />
                </Link>
                <Link href="#" className="text-primary hover:text-primary transition-colors">
                  <Instagram size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
