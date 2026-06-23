import { Home } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("not_found");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="relative z-10 max-w-xl w-full mx-auto text-center space-y-8">
          {/* 404 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-[0.3em] uppercase text-primary/70 dark:text-secondary/70">
              {t("title")}
            </p>
            <h1 className="text-[7rem] leading-none font-extrabold bg-gradient-to-br from-primary via-primary/80 to-secondary bg-clip-text text-transparent drop-shadow-sm select-none dark:text-secondary">
              404
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full opacity-60" />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("page_not_found")}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {t("message")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-primary/30"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                {t("back_to_home")}
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
