"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Search, 
  Send, 
  BarChart3, 
  Settings, 
  ChevronRight,
  Database,
  Activity,
  Cpu,
  Globe,
  LogOut,
  Terminal
} from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [health, setHealth] = useState({ database: 'loading', scraper: 'loading', llm: 'loading' });

  useEffect(() => {
    const checkHealth = () => {
      fetch('/api/health')
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(() => setHealth({ database: 'down', scraper: 'down', llm: 'down' }));
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Lead Scraper", href: "/dashboard/scraper", icon: <Search size={20} /> },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: <Send size={20} /> },
    { name: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 size={20} /> },
    { name: "Settings", href: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="dashboard-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-primary)' }}></div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-outfit)' }}>LeadPulse</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  color: isActive ? '#fff' : 'var(--muted-foreground)',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent'
                }}
              >
                {item.icon}
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                {isActive && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
              </Link>
            );
          })}
        </nav>
        
        {/* System Status Indicators */}
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.25rem' }}>System Status</div>
          <StatusItem label="Database" status={health.database} icon={<Database size={12} />} />
          <StatusItem label="Scraper" status={health.scraper} icon={<Globe size={12} />} />
          <StatusItem label="AI Engine" status={health.llm} icon={<Cpu size={12} />} />
        </div>

        <div className="glass-card" style={{ padding: '0.75rem 1rem', marginTop: 'auto', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserButton afterSignOutUrl="/" />
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 700, color: 'white' }}>Pro Account</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>ACTIVE</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem', padding: '0.5rem' }}>
          <SignOutButton>
            <button className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px' }}>
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function StatusItem({ label, status, icon }: { label: string, status: string, icon: React.ReactNode }) {
  const isUp = status === 'up';
  const isLoading = status === 'loading';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ color: isLoading ? 'var(--muted-foreground)' : isUp ? '#10b981' : '#ef4444' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.75rem', flex: 1, color: 'var(--muted-foreground)' }}>{label}</span>
      <div style={{ 
        width: '6px', 
        height: '6px', 
        borderRadius: '50%', 
        background: isLoading ? '#fbbf24' : isUp ? '#10b981' : '#ef4444',
        boxShadow: isUp ? '0 0 8px #10b981' : 'none'
      }}></div>
    </div>
  );
}
