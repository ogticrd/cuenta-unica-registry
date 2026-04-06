import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLocale } from "@/lib/i18n/server";
import { TermsContent, type TermsData } from "./terms-content";
import termsEn from "./data/terms-en.json";
import termsEs from "./data/terms-es.json";

export default async function TermsPage() {
  const locale = await getCurrentLocale();
  
  const title = locale === "es" 
    ? "Términos de Uso y Política de Privacidad" 
    : "Terms of Use and Privacy Policy";
    
  const backText = locale === "es" 
    ? "Volver al registro" 
    : "Back to registration";

  const termsData = locale === "es" ? termsEs : termsEn;

  return (
    <main className="flex-1 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="w-full mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-border dark:border-slate-800 rounded bg-white dark:bg-card">
          <CardHeader className="space-y-4 pb-4 pt-8 flex flex-col items-center text-center border-b border-border dark:border-slate-800 mx-6">
            <Image
              src="/images/cuenta-unica-icon.svg"
              alt="Cuenta Única"
              width={98}
              height={96}
              className="h-16 w-auto rounded-lg"
            />
            <CardTitle className="text-xl font-bold text-primary dark:text-blue-400">
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 pb-8 px-8 space-y-8">
            <TermsContent data={termsData as TermsData} />

            <div className="pt-4 flex justify-center">
              <Link
                href="/register"
                className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:text-foreground transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {backText}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
