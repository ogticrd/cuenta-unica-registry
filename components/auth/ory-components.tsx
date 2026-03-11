"use client"

import Image from "next/image"
import Link from "next/link"
import type { OryCardFooterProps } from "@ory/elements-react"
import type { PropsWithChildren } from "react"
import { useT } from "@/hooks/use-t"
import { ROUTES } from "@/lib/constants/routes"

/**
 * Custom CUC Card Header — includes CUC logo + "Acceso Cuenta Única" title + subtitle
 * Note: Ory's DefaultCardHeader internally renders <Card.Logo />, so we
 * embed the logo directly here instead of as a separate Logo override.
 */

export function CucCardHeader(_props: PropsWithChildren) {
    const t = useT("login")
    return (
        <div className="text-center">
            <div className="flex justify-center">
                <Image src="/images/cuenta-unica-icon.png" alt="Cuenta Única" width={64} height={64} className="rounded-lg" />
            </div>
            <h1 className="text-xl font-bold text-primary dark:text-blue-400" style={{ marginTop: "20px" }}>
                {t("card_title")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400" style={{ marginTop: "8px" }}>
                {t("card_subtitle")}
            </p>
        </div>
    )
}

/**
 * Custom CUC Card Footer — "¿No tienes cuenta?" section with descriptive text
 * and outline button to create account
 */
export function CucCardFooter(_props: OryCardFooterProps) {
    const t = useT("login")
    return (
        <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400" style={{ marginBottom: "20px" }}>
                <span className="font-medium text-[#0087FF] dark:text-blue-400">
                    {t("no_account")}
                </span>{" "}
                {t("register_cta")}
            </p>
            <Link
                href={ROUTES.register}
                className="cuc-register-button"
            >
                {t("create_account")}
            </Link>
        </div>
    )
}

/**
 * Custom CUC Recovery Header
 */
export function CucRecoveryHeader(_props: PropsWithChildren) {
    return (
        <div className="text-center">
            <div className="flex justify-center">
                <Image src="/images/cuenta-unica-icon.png" alt="Cuenta Única" width={64} height={64} className="rounded-lg" />
            </div>
            <h1 className="text-xl font-bold text-primary dark:text-blue-400" style={{ marginTop: "20px" }}>
                Restablecer contraseña
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400" style={{ marginTop: "8px" }}>
                Para restablecer la contraseña, ingrese su correo electrónico registrado
            </p>
        </div>
    )
}

/**
 * Custom CUC Recovery Footer
 */
export function CucRecoveryFooter(_props: OryCardFooterProps) {
    return (
        <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Recuerdas sus credenciales?{" "}
                <Link href={ROUTES.login} className="font-medium !text-secondary dark:!text-blue-400">
                    Inicia sesión
                </Link>
            </p>
        </div>
    )
}

