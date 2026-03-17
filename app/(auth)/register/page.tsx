import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { RegisterWizard } from "@/components/auth/register/register-wizard"

export default async function RegistrationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#eff7ff] dark:bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <RegisterWizard />
        </div>
      </main>

      <Footer />
    </div>
  )
}
