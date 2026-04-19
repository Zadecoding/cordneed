import type { Metadata } from 'next';
import LandingNavbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import PricingSection from '@/components/landing/PricingSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Cordneed — AI-Powered Mobile App Builder',
  description:
    'Build production-ready Android & iOS apps from a single text prompt. Cordneed uses Gemini AI to generate complete React Native Expo projects instantly.',
};

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#040816' }} className="noise">
      <LandingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
