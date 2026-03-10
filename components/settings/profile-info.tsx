"use client"

import { PersonalInfoField } from "@/components/dashboard/personal-info-field"
import { useAuth } from "@/lib/auth-context"
import { Shield, CheckCircle, User, Mail, Calendar, MapPin, Hash, Users, Book } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ProfileInfo() {
    const { user } = useAuth()

    if (!user) {
        return null
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 mb-8 pb-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pt-4 pb-8 border-b dark:border-border">
                <div className="relative">
                    <Avatar className="w-24 h-24 text-4xl border border-border shadow-sm ring-4 ring-primary/10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-3xl">
                            {user?.name?.trim()?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background shadow-sm">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                </div>

                <div className="text-center md:text-left flex-1 pt-2">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{user.fullName || (user.name + " " + user.lastName)}</h1>
                    <div className="flex flex-col md:flex-row items-center gap-3 mt-3 text-muted-foreground">
                        <span className="text-lg">Cédula: {user.cedula}</span>
                        <span className="hidden md:inline text-border">•</span>
                        <div className="flex items-center justify-center text-sm font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10 px-3 py-1 rounded-full w-max mx-auto md:mx-0 border border-green-200 dark:border-green-500/20">
                            <Shield className="w-4 h-4 mr-1.5" />
                            Identidad verificada
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Information Grid */}
            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-5 text-foreground flex items-center gap-2.5">
                        <span className="inline-block w-1 h-5 rounded-full bg-primary"></span>
                        Información Personal
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PersonalInfoField
                            label="Nombre"
                            value={user.name || ""}
                            icon={<User className="w-4 h-4 text-muted-foreground/70" />}
                        />
                        <PersonalInfoField
                            label="Apellido"
                            value={user.lastName || ""}
                            icon={<User className="w-4 h-4 text-muted-foreground/70" />}
                        />
                        <PersonalInfoField
                            label="Cédula de identidad"
                            value={user.cedula || ""}
                            icon={<Hash className="w-4 h-4 text-muted-foreground/70" />}
                        />
                        <PersonalInfoField
                            label="Pasaporte"
                            value={user.passport || "No registrado"}
                            icon={<Book className="w-4 h-4 text-muted-foreground/70" />}
                        />
                        <PersonalInfoField
                            label="Sexo"
                            value={user.gender || ""}
                            icon={<Users className="w-4 h-4 text-muted-foreground/70" />}
                        />
                        <PersonalInfoField
                            label="Fecha de nacimiento"
                            value={user.birthDate || ""}
                            icon={<Calendar className="w-4 h-4 text-muted-foreground/70" />}
                        />
                        <PersonalInfoField
                            label="Nacionalidad"
                            value={user.nationality || "No registrado"}
                            icon={<MapPin className="w-4 h-4 text-muted-foreground/70" />}
                        />
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-5 text-foreground flex items-center gap-2.5">
                        <span className="inline-block w-1 h-5 rounded-full bg-primary"></span>
                        Información de Contacto
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PersonalInfoField
                            label="Correo electrónico"
                            value={user.email || ""}
                            icon={<Mail className="w-4 h-4 text-muted-foreground/70" />}
                            verified={true}
                        />
                    </div>
                </div>
            </div>

            {/* Subtle Footer Note */}
            <div className="pt-8 border-t dark:border-border text-center mt-12">
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    La información mostrada proviene de registros oficiales (JCE, TSS, DGII) y está sincronizada con el sistema.
                    Para modificar tus datos, debes dirigirte a las oficinas correspondientes de la Junta Central Electoral.
                </p>
            </div>
        </div>
    )
}
