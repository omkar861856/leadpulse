"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Mail, 
  Globe, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Lock
} from "lucide-react";
import { useEffect } from "react";

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [data, setData] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch both leads and stats
    Promise.all([
      fetch('/api/leads').then(res => res.json()),
      fetch('/api/dashboard/stats').then(res => res.json())
    ]).then(([leadsData, statsData]) => {
      setLeads(leadsData);
      setData(statsData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const stats = data?.stats || { totalLeads: 0, totalScrapes: 0 };

  // Map leads to campaign groups (mocking the grouping for now since we don't have separate campaigns collection yet)
  const campaigns = [
    { id: 1, name: "Scraped Leads", leads: leads.length, status: 'Active', method: 'Email', sent: 0, responded: 0 },
  ];

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Campaigns</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Manage and automate your outreach across multiple channels.</p>
        </div>
        <button className="btn-primary" disabled>
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Locked Content Area */}
      <div style={{ position: 'relative' }}>
        {/* Coming Soon Overlay */}
        <div style={{ 
          position: 'absolute', 
          inset: '-1rem', 
          zIndex: 10, 
          background: 'rgba(0,0,0,0.3)', 
          backdropFilter: 'blur(8px)', 
          borderRadius: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ 
            background: 'var(--gradient-primary)', 
            padding: '1rem', 
            borderRadius: '50%', 
            marginBottom: '1.5rem',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
          }}>
            <Lock size={48} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Coming Soon</h2>
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', maxWidth: '400px', lineHeight: '1.6' }}>
            Automated email and LinkedIn outreach sequences are currently in development. You will be able to launch campaigns directly to your scraped leads soon.
          </p>
          <button className="btn-secondary" style={{ marginTop: '2rem' }}>
            Get Notified on Launch
          </button>
        </div>

        {/* Stats Overview (Blurred) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Leads', val: leads.length, icon: <Users size={20} />, color: '#6366f1' },
            { label: 'Scraped Sessions', val: stats.totalScrapes, icon: <TrendingUp size={20} />, color: '#10b981' },
            { label: 'Messages Sent', val: '0', icon: <Mail size={20} />, color: '#a855f7' },
            { label: 'Avg. Response', val: '0.0%', icon: <MessageSquare size={20} />, color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ color: stat.color, marginBottom: '1rem', background: `${stat.color}15`, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stat.val}</div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden', opacity: 0.5 }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '2rem' }}>
            {['All', 'Active', 'Draft', 'Completed'].map(tab => (
              <button key={tab} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', padding: '0.5rem 0' }}>{tab}</button>
            ))}
          </div>
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Campaign manager visualization placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
