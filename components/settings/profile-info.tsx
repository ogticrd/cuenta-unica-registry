"use client"

import { PersonalInfoField } from "@/components/dashboard/personal-info-field"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, User, Mail, Calendar, MapPin, Hash, Users, FileText, Award } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ProfileInfo() {
    const { user } = useAuth()

    if (!user) {
        return null
    }

    return (
        <div className="max-w-6xl space-y-8 mb-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary dark:text-blue-400 mb-2">Mis datos personales</h1>
                    <p className="text-gray-600 dark:text-gray-400">Información oficial registrada en el sistema gubernamental</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Datos verificados
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                        <Award className="w-4 h-4 mr-1" />
                        Perfil oficial
                    </Badge>
                </div>
            </div>

            {/* Information Notice */}
            <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-600 bg-amber-50/50 dark:bg-amber-900/10">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-1">Información oficial</h3>
                            <p className="text-amber-700 dark:text-amber-500/80 text-sm">
                                Los datos mostrados provienen de registros oficiales del gobierno dominicano y no pueden ser
                                modificados desde esta plataforma.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Avatar Section */}
                <div className="lg:col-span-1">
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-lg">Identificación oficial</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="relative inline-block">
                                <Avatar className="relative overflow-visible" style={{ width: "128px", height: "128px" }}>
                                    <AvatarFallback className="text-5xl dark:bg-gray-800">{user?.name?.trim()?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-background">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName}</h3>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">Cédula: {user.cedula}</p>
                                <div className="flex flex-col gap-2">
                                    <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Identidad verificada
                                    </Badge>
                                    <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Registro oficial
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Personal Information Section */}
                <div className="lg-col-span-2 space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary dark:text-blue-400" />
                                <CardTitle>Información personal</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PersonalInfoField
                                    label="Nombre"
                                    value={user.name || ""}
                                    icon={<User className="w-4 h-4 text-gray-500" />}
                                />
                                <PersonalInfoField
                                    label="Apellido"
                                    value={user.lastName || ""}
                                    icon={<User className="w-4 h-4 text-gray-500" />}
                                />
                                <PersonalInfoField
                                    label="Cédula de identidad"
                                    value={user.cedula || ""}
                                    icon={<Hash className="w-4 h-4 text-gray-500" />}
                                />
                                <PersonalInfoField
                                    label="Sexo"
                                    value={user.gender || ""}
                                    icon={<Users className="w-4 h-4 text-gray-500" />}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-primary dark:text-blue-400" />
                                <CardTitle>Información de contacto</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <PersonalInfoField
                                label="Correo electrónico"
                                value={user.email || ""}
                                icon={<Mail className="w-4 h-4 text-gray-500" />}
                                verified={true}
                            />
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary dark:text-blue-400" />
                                <CardTitle>Información adicional</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PersonalInfoField
                                    label="Nacionalidad"
                                    value={user.nationality || ""}
                                    icon={<MapPin className="w-4 h-4 text-gray-500" />}
                                />
                                <PersonalInfoField
                                    label="Fecha de nacimiento"
                                    value={user.birthDate || ""}
                                    icon={<Calendar className="w-4 h-4 text-gray-500" />}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Data Source Information */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/10 dark:to-indigo-900/10 dark:border-blue-900/50">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fuente de datos oficial</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Esta información proviene directamente de los registros oficiales de la República Dominicana y está
                                sincronizada con las bases de datos gubernamentales.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-background">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    JCE - Junta Central Electoral
                                </Badge>
                                <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-white dark:bg-background">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    TSS - Tesorería de la Seguridad Social
                                </Badge>
                                <Badge variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-white dark:bg-background">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    DGII - Dirección General de Impuestos Internos
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="border-gray-200 dark:border-border">
                <CardContent className="p-6">
                    <div className="text-center space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">¿Necesitas actualizar tu información?</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
                            Para modificar tus datos personales, debes dirigirte a las oficinas correspondientes de la Junta Central
                            Electoral (JCE) o contactar directamente con las instituciones gubernamentales pertinentes.
                        </p>
                        <div className="flex justify-center gap-4 pt-2">
                            <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                                <FileText className="w-3 h-3 mr-1" />
                                Requisitos de actualizacion
                            </Badge>
                            <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                                <MapPin className="w-3 h-3 mr-1" />
                                Oficinas JCE
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
