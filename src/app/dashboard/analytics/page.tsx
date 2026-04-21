"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

import { useState, useEffect } from "react";

export default function AnalyticsPage() {
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
        console.error('Failed to fetch analytics', err);
        setLoading(false);
      });
  }, []);

  const stats = data?.stats || { totalLeads: 0, totalScrapes: 0 };
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Analytics</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Track your performance and conversion rates.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Leads Found', val: stats.totalLeads, unit: '' },
          { label: 'Search Sessions', val: stats.totalScrapes, unit: '' },
          { label: 'Conversion Rate', val: '0.0', unit: '%' }
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{stat.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.val}</span>
              <span style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
        <div style={{ textAlign: 'center' }}>
          <BarChart3 size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
          <h3>Interactive Charts coming soon</h3>
          <p>Real-time data visualization is being processed.</p>
        </div>
      </div>
    </div>
  );
}
