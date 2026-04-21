"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  MapPin, 
  Zap, 
  ArrowUpRight, 
  Activity,
  History
} from "lucide-react";
import Link from "next/link";

import { useState, useEffect } from "react";

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Activity className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  const stats = data?.stats || { totalLeads: 0, totalScrapes: 0, newLeadsToday: 0 };
  const activities = data?.recentActivities || [];
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Good morning, Growth Wizard</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Here is what's happening with your lead machine today.</p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}>
            <Users size={120} />
          </div>
          <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Leads Found</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.totalLeads}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {stats.newLeadsToday} new in last 24h
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}>
            <Activity size={120} />
          </div>
          <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Sessions</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.totalScrapes}</div>
          <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Scraping operations</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Automatic scans active</h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Your automated recurring scans are running periodically to find new opportunities.</p>
          <button className="btn-primary" style={{ width: '100%', padding: '0.6rem' }} disabled>Plan Upgrade Available</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Recent Activity */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <History size={20} /> Recent Activity
            </h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.875rem', cursor: 'pointer' }}>View All</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.length > 0 ? activities.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: i === activities.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem' }}>{item.description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{new Date(item.timestamp).toLocaleString()}</div>
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/dashboard/scraper" className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '10px', padding: '0.75rem' }}>
              <MapPin size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Start Local Scan</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Find businesses near you</div>
            </div>
          </Link>

          <Link href="/dashboard/campaigns" className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '10px', padding: '0.75rem' }}>
              <Zap size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Create Campaign</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Automate your outreach</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
