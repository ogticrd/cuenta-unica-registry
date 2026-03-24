"use client";

import Image from "next/image";
import Link from "next/link";

import { Facebook, Youtube, Twitter, Instagram } from "lucide-react";
import { useT } from "@/hooks/use-t";

export function Footer() {
  const t = useT("footer");
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="bg-primary text-primary-foreground dark:bg-card dark:text-foreground dark:border-t dark:border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Government Logo Section */}
            <div className="flex flex-col space-y-3">
              <Image
                src="/images/government-seal.png"
                alt="Escudo República Dominicana"
                width={481}
                height={196}
                className="w-[180px] h-auto filter brightness-0 invert"
              />
            </div>

            {/* CONÓCENOS / ABOUT US */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("know_us")}</h4>
              <p className="text-xs leading-relaxed font-semibold text-gray-300">
                {t("know_us_body")}
              </p>
            </div>

            {/* CONTÁCTANOS / CONTACT US */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("contact")}</h4>
              <div className="space-y-1 text-xs font-semibold text-gray-300">
                <p>Tel: (809)-286-1009</p>
                <p>Fax: (809)-732-5465</p>
                <p>info@ogtic.gob.do</p>
              </div>
            </div>

            {/* BÚSCANOS / FIND US */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("find_us")}</h4>
              <p className="text-xs leading-relaxed font-semibold text-gray-300">
                {t("find_us_address")}
              </p>
            </div>

            {/* INFÓRMATE / INFORMATION */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">{t("info")}</h4>
              <div className="space-y-1 text-xs font-semibold text-gray-300">
                <Link href="/terms" className="block hover:underline">
                  {t("terms")}
                </Link>
                <Link href="/privacy" className="block hover:underline">
                  {t("privacy")}
                </Link>
                <Link href="/faq" className="block hover:underline">
                  {t("faq")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <div className="bg-white dark:bg-background">
        <div className="container mx-auto p-4 bg-white dark:bg-background">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <p className="text-xs text-primary dark:text-muted-foreground font-semibold">
                {t("copyright", { year: currentYear })}
              </p>
              <Image
                src="/images/ogtic-logo.png"
                alt="OGTIC"
                width={151}
                height={82}
                className="w-[60px] h-auto"
              />
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-primary dark:text-gray-300 font-semibold">
                {t("follow_us")}
              </span>
              <div className="flex space-x-2">
                <Link
                  href="#"
                  className="text-primary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  <Facebook size={16} />
                </Link>
                <Link
                  href="#"
                  className="text-primary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  <Youtube size={16} />
                </Link>
                <Link
                  href="#"
                  className="text-primary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  <Twitter size={16} />
                </Link>
                <Link
                  href="#"
                  className="text-primary dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
                >
                  <Instagram size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
