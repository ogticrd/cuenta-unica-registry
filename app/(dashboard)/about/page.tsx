"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PlatformFeature } from "@/components/dashboard/platform-feature"
import { YouTubeVideo } from "@/components/dashboard/youtube-video"
import { User, Headphones, Shield, FileText, Bell, Bot, Users, Clock, Globe } from "lucide-react"
import { useT } from "@/hooks/use-t"

export default function AboutPage() {
  const t = useT("about")
  const features = [
    {
      icon: <User size={24} className="text-blue-600 dark:text-blue-400" />,
      title: t("features_list.personal_data.title"),
      description: t("features_list.personal_data.desc"),
    },
    {
      icon: <FileText size={24} className="text-purple-600 dark:text-purple-400" />,
      title: t("features_list.history.title"),
      description: t("features_list.history.desc"),
    },
    {
      icon: <Shield size={24} className="text-red-600 dark:text-red-400" />,
      title: t("features_list.security.title"),
      description: t("features_list.security.desc"),
    },
    {
      icon: <Bell size={24} className="text-orange-600 dark:text-orange-400" />,
      title: t("features_list.notifications.title"),
      description: t("features_list.notifications.desc"),
    },
    {
      icon: <Bot size={24} className="text-indigo-600 dark:text-indigo-400" />,
      title: t("features_list.ai_assistant.title"),
      description: t("features_list.ai_assistant.desc"),
    },
    {
      icon: <Headphones size={24} className="text-green-600 dark:text-green-400" />,
      title: t("features_list.support.title"),
      description: t("features_list.support.desc"),
    },
  ]

  const stats = [
    { number: "2.5M+", label: t("stats_list.citizens"), icon: <Users size={20} /> },
    { number: "15M+", label: t("stats_list.queries"), icon: <FileText size={20} /> },
    { number: "99.9%", label: t("stats_list.uptime"), icon: <Clock size={20} /> },
    { number: "24/7", label: t("stats_list.availability"), icon: <Globe size={20} /> },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-16">
        {/* Minimalist Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary dark:text-blue-400 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Minimalist Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center py-4"
            >
              <div className="text-muted-foreground mb-3">{stat.icon}</div>
              <div className="text-3xl font-bold text-foreground mb-1 tracking-tight">{stat.number}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-center">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Video Tutorial */}
        <div className="pt-8 border-t dark:border-border">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3">{t("video_title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("video_desc")}
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border dark:border-border">
            <YouTubeVideo title="Cuenta Única Ciudadana - Guía Completa" />
          </div>
        </div>

        {/* Clean Features Grid */}
        <div className="pt-8 border-t dark:border-border">
          <h2 className="text-xl font-bold text-foreground mb-8 text-center">{t("features_title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <PlatformFeature
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
