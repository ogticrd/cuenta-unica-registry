"use client";

import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { useT } from "@/hooks/use-t";

const LOGIN_PATH = "/login";
const RECOVERY_PATH = "/recovery";
const REGISTER_PATH = "/register";
const VERIFICATION_PATH = "/verification";

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
          width={64}
          height={64}
          className="w-auto rounded-lg"
        />
      </div>

      <h1
        className="text-xl font-bold text-primary dark:text-blue-400"
        style={{ marginTop: "16px" }}
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
interface CucCardFooterProps {
  recoveryHref?: string;
  registerHref?: string;
  verificationHref?: string;
}

export function CucCardFooter({
  recoveryHref = RECOVERY_PATH,
  registerHref = REGISTER_PATH,
  verificationHref = VERIFICATION_PATH,
}: CucCardFooterProps) {
  const t = useT("login");
  return (
    <div>
      <p
        className="text-sm font-semibold text-secondary text-right dark:text-blue-400"
        style={{ marginBottom: "20px" }}
      >
        <Link href={recoveryHref}>{t("forgot_password")}</Link>
      </p>
      <hr className="my-4 border-gray-200 dark:border-gray-700" />
      <div className="text-center">
        <p
          className="text-sm font-medium text-gray-500 dark:text-gray-400"
          style={{ marginBottom: "20px" }}
        >
          <span className="font-semibold text-secondary dark:text-blue-400">
            <Link href={registerHref}>{t("no_account")}</Link>
          </span>{" "}
          {t("register_cta")}
        </p>
        <Link href={registerHref} className="cuc-register-button">
          {t("create_account")}
        </Link>
        <div className="mt-6 rounded-md bg-gray-200/25 p-2 text-sm ring-1 ring-inset ring-gray-900/5 dark:bg-gray-800/50 dark:ring-white/10">
          <p className="font-medium text-gray-600 dark:text-gray-400">
            {t("need_verification_prompt")}{" "}
            <Link
              href={verificationHref}
              className="font-semibold !text-secondary transition-colors dark:text-blue-400"
            >
              {t("verify_account")}
            </Link>
          </p>
        </div>
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
interface CucRecoveryFooterProps {
  loginHref?: string;
}

export function CucRecoveryFooter({
  loginHref = LOGIN_PATH,
}: CucRecoveryFooterProps) {
  const t = useT("login");
  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("recovery_remember")}{" "}
        <Link
          href={loginHref}
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
interface CucVerificationFooterProps {
  loginHref?: string;
}

export function CucVerificationFooter({
  loginHref = LOGIN_PATH,
}: CucVerificationFooterProps) {
  const t = useT("login");
  return (
    <div className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("verification_footer_text")}{" "}
        <Link
          href={loginHref}
          className="font-medium !text-secondary dark:!text-blue-400"
        >
          {t("verification_login_cta")}
        </Link>
      </p>
    </div>
  );
}
