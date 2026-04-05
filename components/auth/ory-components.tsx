"use client";

import type { OryCardFooterProps } from "@ory/elements-react";
import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { useT } from "@/hooks/use-t";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Custom CUC Card Header — includes CUC logo + "Acceso Cuenta Única" title + subtitle
 * Note: Ory's DefaultCardHeader internally renders <Card.Logo />, so we
 * embed the logo directly here instead of as a separate Logo override.
 */

export function CucCardHeader(_props: PropsWithChildren) {
  const t = useT("login");
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <Image
          src="/images/cuenta-unica-icon.svg"
          alt="Cuenta Única"
          width={98}
          height={96}
          className="h-16 w-auto rounded-lg"
        />
      </div>
      <h1
        className="text-xl font-bold tracking-tight text-primary dark:text-blue-400"
        style={{ marginTop: "20px" }}
      >
        {t("card_title")}
      </h1>
      <p
        className="text-sm font-medium text-gray-500 dark:text-gray-400"
        style={{ marginTop: "8px" }}
      >
        {t("card_subtitle")}
      </p>
    </div>
  );
}

/**
 * Custom CUC Card Footer — "¿No tienes cuenta?" section with descriptive text
 * and outline button to create account
 */
export function CucCardFooter(_props: OryCardFooterProps) {
  const t = useT("login");
  return (
    <div className="text-center">
      <p
        className="text-sm font-semibold text-secondary dark:text-blue-400"
        style={{ marginBottom: "20px" }}
      >
        <Link href={ROUTES.recovery}>{t("forgot_password")}</Link>
      </p>
      <p
        className="text-sm font-medium text-gray-500 dark:text-gray-400"
        style={{ marginBottom: "20px" }}
      >
        <span className="font-semibold text-secondary dark:text-blue-400">
          <Link href={ROUTES.register}>{t("no_account")}</Link>
        </span>{" "}
        {t("register_cta")}
      </p>
      <Link href={ROUTES.register} className="cuc-register-button">
        {t("create_account")}
      </Link>
      <div className="mt-6 rounded-md bg-gray-50/80 p-2 text-sm ring-1 ring-inset ring-gray-900/5 dark:bg-gray-800/50 dark:ring-white/10">
        <p className="font-medium text-gray-600 dark:text-gray-400">
          {t("need_verification_prompt")}{" "}
          <Link
            href={ROUTES.verification}
            className="font-semibold !text-secondary transition-colors dark:text-blue-400"
          >
            {t("verify_account")}
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Custom CUC Recovery Header
 */
export function CucRecoveryHeader(_props: PropsWithChildren) {
  const t = useT("login");
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <Image
          src="/images/cuenta-unica-icon.svg"
          alt="Cuenta Única"
          width={98}
          height={96}
          className="h-16 w-auto rounded-lg"
        />
      </div>
      <h1
        className="text-xl font-bold text-primary dark:text-blue-400"
        style={{ marginTop: "20px" }}
      >
        {t("recovery_title")}
      </h1>
      <p
        className="text-sm text-gray-600 dark:text-gray-400"
        style={{ marginTop: "8px" }}
      >
        {t("recovery_subtitle")}
      </p>
    </div>
  );
}

/**
 * Custom CUC Recovery Footer
 */
export function CucRecoveryFooter(_props: OryCardFooterProps) {
  const t = useT("login");
  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("recovery_remember")}{" "}
        <Link
          href={ROUTES.login}
          className="font-medium !text-secondary dark:!text-blue-400"
        >
          {t("recovery_login_cta")}
        </Link>
      </p>
    </div>
  );
}

/**
 * Custom CUC Verification Header
 */
export function CucVerificationHeader(_props: PropsWithChildren) {
  const t = useT("login");
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <Image
          src="/images/cuenta-unica-icon.svg"
          alt="Cuenta Única"
          width={98}
          height={96}
          className="h-16 w-auto rounded-lg"
        />
      </div>
      <h1
        className="text-xl font-bold text-primary dark:text-blue-400"
        style={{ marginTop: "20px" }}
      >
        {t("verification_title")}
      </h1>
      <p
        className="text-sm text-gray-600 dark:text-gray-400"
        style={{ marginTop: "8px" }}
      >
        {t("verification_subtitle")}
      </p>
    </div>
  );
}

/**
 * Custom CUC Verification Footer
 */
export function CucVerificationFooter(_props: OryCardFooterProps) {
  const t = useT("login");
  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("verification_footer_text")}{" "}
        <Link
          href={ROUTES.login}
          className="font-medium !text-secondary dark:!text-blue-400"
        >
          {t("verification_login_cta")}
        </Link>
      </p>
    </div>
  );
}
