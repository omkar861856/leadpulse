"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Target, Zap, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-vh-100" style={{ background: 'var(--background)' }}>
      {/* Navbar */}
      <nav className="glass fixed-top w-100" style={{ zIndex: 100, borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
        <div className="container d-flex justify-between align-center" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LeadPulse
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/sign-in" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Login</Link>
            <Link href="/sign-up" className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: '10rem', paddingBottom: '6rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        
        <div className="container text-center animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem' }}>
              Scrape <span style={{ color: 'var(--primary)' }}>Nearby Leads</span> <br />
              Launch Viral Campaigns.
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              The all-in-one platform to find local businesses, extract deep data, and automate your outreach with AI-powered multi-channel campaigns.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                Launch Dashboard <ArrowRight size={20} />
              </Link>
              <button className="btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                View Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '6rem 2rem', background: '#080808' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Everything you need to scale</h2>
            <p style={{ color: 'var(--muted-foreground)' }}>From discovery to conversion, we've got you covered.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { icon: <Globe size={24} color="#6366f1" />, title: "Hyper-Local Scraping", desc: "Extract data from Google Maps, Yelp, and social profiles with one click." },
              { icon: <Target size={24} color="#a855f7" />, title: "Precision Targeting", desc: "Filter leads by industry, revenue, employee count, and social presence." },
              { icon: <Zap size={24} color="#f59e0b" />, title: "Automated Workflows", desc: "Set up multi-step outreach sequences across Email, LinkedIn, and SMS." }
            ].map((feature, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '2.5rem' }}>
                <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--muted-foreground)', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--muted-foreground)' }}>© 2026 LeadPulse AI</div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#" className="hover-text-primary">Terms</a>
            <a href="#" className="hover-text-primary">Privacy</a>
            <a href="#" className="hover-text-primary">Help</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
