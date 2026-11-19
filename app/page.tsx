"use client";

import { Benefits } from "@/components/home/benefits";
import { FAQSection } from "@/components/home/faq/faq-section";
import { GovernmentEntities } from "@/components/home/government";
import { GovernmentPartners } from "@/components/home/government-partners";
import { Hero } from "@/components/home/hero/Hero";
import { Steps } from "@/components/home/steps";
import { WhatIsCuc } from "@/components/home/what-is-cuc";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* What is Cuenta Única Section */}
      <WhatIsCuc />

      {/* Benefits Section */}
      <Benefits />

      {/* Steps Section */}
      <Steps />

      {/* Integrated Institutions Section */}
      <GovernmentPartners />

      {/* For Government Entities Section */}
      <GovernmentEntities />

      {/* FAQ Section */}
      <FAQSection />

      <Footer />
    </div>
  );
}
