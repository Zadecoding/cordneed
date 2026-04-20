'use client';

import Link from 'next/link';
import { Smartphone, GitBranch, AtSign, LinkIcon, Mail } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ],
  Developers: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Status', href: '#' },
  ],
};

const socialIcons = [GitBranch, AtSign, LinkIcon, Mail];

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(30,40,80,0.6)', paddingTop: 64, paddingBottom: 32, position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>

        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 40,
          marginBottom: 48,
        }}>

          {/* Brand — wider */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/logo.png" alt="Cordneed" width={32} height={32} style={{ borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
              <span className="gradient-text" style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-space-grotesk)' }}>
                Cordneed
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, maxWidth: 240, marginBottom: 20 }}>
              The AI-powered platform to build production-ready React Native Expo apps from natural language prompts.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {socialIcons.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(14,22,56,0.8)', border: '1px solid rgba(99,102,241,0.22)',
                    color: '#64748b', textDecoration: 'none', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { const a = e.currentTarget; a.style.borderColor = 'rgba(99,102,241,0.5)'; a.style.color = '#818cf8'; }}
                  onMouseLeave={e => { const a = e.currentTarget; a.style.borderColor = 'rgba(99,102,241,0.22)'; a.style.color = '#64748b'; }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                {category}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', transition: 'color 0.2s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(30,40,80,0.6)', paddingTop: 28, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#334155' }}>
            © {new Date().getFullYear()} Cordneed. All rights reserved. Made in India 🇮🇳
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
            <span>Powered by</span>
            <span style={{ color: '#6366f1', fontWeight: 500 }}>Gemini AI</span>
            <span>·</span>
            <span>Payments by</span>
            <span style={{ color: '#6366f1', fontWeight: 500 }}>Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
