"use client"

import Image from "next/image"
import Link from "next/link"
import type { OryCardFooterProps } from "@ory/elements-react"
import type { PropsWithChildren } from "react"

/**
 * Custom CUC Card Header — includes CUC logo + "Acceso Cuenta Única" title + subtitle
 * Note: Ory's DefaultCardHeader internally renders <Card.Logo />, so we
 * embed the logo directly here instead of as a separate Logo override.
 */
export function CucCardContent(_props: PropsWithChildren) {
    return (
        <div className="text-center">
            <p className="text-gray-600">Contenido de la tarjeta</p>
        </div>
    )
}

export function CucCardHeader(_props: PropsWithChildren) {
    return (
        <div className="text-center">
            <div className="flex justify-center">
                <Image src="/images/cuenta-unica-icon.png" alt="Cuenta Única" width={64} height={64} className="rounded-lg" />
            </div>
            <h1 className="text-xl font-semibold text-[#003876]" style={{ marginTop: "20px" }}>
                Acceso Cuenta Única
            </h1>
            <p className="text-sm text-gray-600" style={{ marginTop: "8px" }}>
                Puedes acceder a tu cuenta con tu número de identidad
                &quot;Cédula&quot; o correo electrónico registrado
            </p>
        </div>
    )
}

/**
 * Custom CUC Card Footer — "¿No tienes cuenta?" section with descriptive text
 * and outline button to create account
 */
export function CucCardFooter(_props: OryCardFooterProps) {
    return (
        <div className="text-center">
            <p className="text-sm text-gray-600" style={{ marginBottom: "20px" }}>
                <span className="font-medium text-[#0087FF]">
                    ¿No tienes cuenta?
                </span>{" "}
                Registrate, accede a los servicios del Estado Dominicano con un
                único usuario y contraseña, de forma segura y confiable
            </p>
            <Link
                href="/auth/register"
                className="cuc-register-button"
            >
                CREAR SU CUENTA ÚNICA CIUDADANA
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
            <h1 className="text-xl font-semibold text-[#003876]" style={{ marginTop: "20px" }}>
                Restablecer contraseña
            </h1>
            <p className="text-sm text-gray-600" style={{ marginTop: "8px" }}>
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
            <p className="text-sm text-gray-600">
                ¿Recuerdas sus credenciales?{" "}
                <Link href="/login" className="font-medium" style={{ color: "#0087FF" }}>
                    Inicia sesión
                </Link>
            </p>
        </div>
    )
}

