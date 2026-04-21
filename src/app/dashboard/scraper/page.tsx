"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Play, 
  Loader2, 
  Download, 
  MoreVertical, 
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Database,
  Activity
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  industry: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  status: 'scraped' | 'connected';
}

export default function ScraperPage() {
  const [keyword, setKeyword] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<Business[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'search' | 'url'>('search');
  const [targetUrl, setTargetUrl] = useState("");
  const [loadingLeads, setLoadingLeads] = useState<Set<string>>(new Set());
  const [scrapeLogs, setScrapeLogs] = useState<{msg: string, type: 'info'|'success'|'error'}[]>([]);
  const [debugContent, setDebugContent] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (msg: string, type: 'info'|'success'|'error' = 'info') => {
    setScrapeLogs(prev => [...prev, { msg, type }]);
  };

  // Restore latest results on mount
  useEffect(() => {
    // Restore latest results
    fetch('/api/scrape')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data && data.leads) {
          setResults(data.leads);
          setSummary(data.summary);
          setKeyword(data.keyword || "");
          if (data.url) setTargetUrl(data.url);
        }
      })
      .catch(err => console.error('Failed to restore state:', err));
  }, []);

  const enrichLead = async (lead: Business) => {
    setLoadingLeads(prev => new Set(prev).add(lead.id));
    try {
      const res = await fetch('/api/scrape/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead })
      });
      const enriched = await res.json();
      if (!enriched.error) {
        setResults(prev => prev.map(item => item.id === lead.id ? { ...item, ...enriched } : item));
      }
    } catch (err) {
      console.error('Enrichment failed for', lead.id, err);
    } finally {
      setLoadingLeads(prev => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    
    const headers = ["Name", "Industry", "Location", "Website", "Email", "Phone", "LinkedIn", "Instagram", "Description"];
    const rows = results.map(biz => [
      `"${biz.name?.replace(/"/g, '""') || ''}"`,
      `"${biz.industry?.replace(/"/g, '""') || ''}"`,
      `"${biz.location?.replace(/"/g, '""') || ''}"`,
      `"${biz.website || ''}"`,
      `"${biz.email || ''}"`,
      `"${biz.phone || ''}"`,
      `"${(biz as any).socials?.linkedin || ''}"`,
      `"${(biz as any).socials?.instagram || ''}"`,
      `"${(biz as any).description?.replace(/"/g, '""') || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScrape = async () => {
    if (activeMode === 'search' && (!keyword || !location)) return;
    if (activeMode === 'url' && !targetUrl) return;
    
    setIsScraping(true);
    setResults([]);
    setSummary(null);
    setScrapeLogs([]);
    setDebugContent(null);
    setProgress(10);
    setError(null);
    
    addLog(`Initiating ${activeMode} mode...`);

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev < 95 ? prev + 1 : prev));
    }, 1000);

    try {
      const payload = activeMode === 'search' 
        ? { mode: 'search', keyword, location }
        : { mode: 'url', url: targetUrl };

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection failed');
      }

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentSummary = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('event: ')) continue;
          
          const eventMatch = line.match(/^event: (.*)\ndata: (.*)$/m);
          if (!eventMatch) continue;

          const event = eventMatch[1];
          const data = JSON.parse(eventMatch[2]);

          if (event === 'status') {
            addLog(data.message, data.isFallback ? 'error' : 'info');
            if (data.debugMarkdown) setDebugContent(data.debugMarkdown);
          } else if (event === 'token') {
            currentSummary += data.chunk;
            // Only show summary part in the UI live (before LEADS:)
            const summaryOnly = currentSummary.split(/LEADS:/i)[0]
                                             .replace(/SUMMARY:/i, '')
                                             .trim();
            setSummary(summaryOnly);
          } else if (event === 'complete') {
            clearInterval(progressInterval);
            setProgress(100);
            
            // Map results with safe IDs for React keys and state tracking
            const leadsWithIds = (data.leads || []).map((l: any) => ({
              ...l,
              id: l.id || `lead_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
            }));

            setResults(leadsWithIds);
            setSummary(data.summary);
            setDebugContent(data.debugMarkdown);
            addLog(`Workflow success: ${leadsWithIds.length} leads found. Starting automatic enrichment...`, 'success');
            
            // Trigger automatic enrichment for each lead
            leadsWithIds.forEach((lead: any) => {
              enrichLead(lead);
            });

            setTimeout(() => {
              setIsScraping(false);
            }, 1000);
          } else if (event === 'error') {
            throw new Error(data.message);
          }
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsScraping(false);
      setProgress(0);
      addLog("Workflow failed: " + err.message, "error");
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleAddLead = async (biz: Business) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...biz, status: 'connected' })
      });

      if (response.ok) {
        setResults(results.map(r => r.id === biz.id ? { ...r, status: 'connected' } : r));
      }
    } catch (err) {
      console.error('Failed to add lead:', err);
    }
  };

  const mockData: Business[] = [
    { id: "1", name: "Peak Dental Care", industry: "Dentist", location: "Los Angeles, CA", email: "hello@peakdental.com", phone: "(555) 123-4567", website: "peakdental.com", status: 'scraped' },
    { id: "2", name: "The Creative Agency", industry: "Marketing", location: "Los Angeles, CA", email: "info@creative.agency", phone: "(555) 987-6543", website: "creative.agency", status: 'scraped' },
    { id: "3", name: "Sunrise Bakery", industry: "Food & Beverage", location: "Santa Monica, CA", email: "contact@sunrise.bakery", phone: "(555) 456-7890", website: "sunrise.bakery", status: 'scraped' },
    { id: "4", name: "Modern Law Firm", industry: "Legal", location: "Beverly Hills, CA", email: "partners@modernlaw.com", phone: "(555) 246-8135", website: "modernlaw.com", status: 'scraped' },
    { id: "5", name: "Fit & Well Gym", industry: "Fitness", location: "Culver City, CA", email: "join@fitwell.gym", phone: "(555) 135-7924", website: "fitwell.gym", status: 'scraped' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Lead Scraper</h1>
            <p style={{ color: 'var(--muted-foreground)' }}>Discover and extract deep business data using AI-powered iterative scraping.</p>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', height: 'fit-content' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.05em' }}>PRO PLAN</span>
          </div>
        </div>
        {results.length > 0 && (
          <button onClick={handleExportCSV} className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Download size={18} /> Export CSV
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <button 
            onClick={() => setActiveMode('search')}
            style={{ 
              background: 'none', border: 'none', color: activeMode === 'search' ? 'var(--primary)' : 'var(--muted-foreground)', 
              fontWeight: activeMode === 'search' ? 600 : 400, cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' 
            }}
          >
            <Search size={18} /> General Search
          </button>
          <button 
            onClick={() => setActiveMode('url')}
            style={{ 
              background: 'none', border: 'none', color: activeMode === 'url' ? 'var(--primary)' : 'var(--muted-foreground)', 
              fontWeight: activeMode === 'url' ? 600 : 400, cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' 
            }}
          >
            <Globe size={18} /> Extract from URL
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          {activeMode === 'search' ? (
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Search Query</label>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} size={18} />
                <input 
                  type="text" 
                  placeholder="e.g. Plumbing services in New York, SaaS founders on LinkedIn" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'white' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Target Website URL</label>
              <div style={{ position: 'relative' }}>
                <Globe style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} size={18} />
                <input 
                  type="url" 
                  placeholder="https://example.com/listings" 
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'white' }}
                />
              </div>
            </div>
          )}
          
          <button 
            className="btn-primary" 
            onClick={handleScrape} 
            disabled={isScraping || (activeMode === 'search' ? !keyword : !targetUrl)}
            style={{ height: '48px', minWidth: '160px' }}
          >
            {isScraping ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {isScraping ? 'Extracting...' : 'Start Extraction'}
          </button>
        </div>

        <AnimatePresence>
          {isScraping && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '1.5rem', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Background Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <motion.div 
                  style={{ height: '100%', background: 'var(--gradient-primary)', width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              {/* Real-time Status Logs */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '150px', overflowY: 'auto' }}>
                {scrapeLogs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '0.25rem', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : 'var(--muted-foreground)' }}>
                    <span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span> {log.msg}
                  </div>
                ))}
                <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: 'var(--primary)' }}>_</motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 'var(--radius)', color: '#ef4444', fontSize: '0.875rem' }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>Check console for full trace or see debug logs above.</div>
          </div>
        )}

        {/* Debug Content Toggle */}
        {(debugContent || isScraping) && (
          <div style={{ marginTop: '1rem' }}>
            <button 
              onClick={() => setShowDebug(!showDebug)} 
              style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}
            >
              {showDebug ? 'Hide' : 'Show'} Scraped Raw Content
            </button>
            {showDebug && (
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#000', borderRadius: '8px', fontSize: '0.7rem', maxHeight: '250px', overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', fontFamily: 'monospace' }}>
                {debugContent || (isScraping ? "Scraping in progress... Content will appear here once retrieved." : "No content retrieved.")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="animate-fade-in">
          {summary && (
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                <Activity size={18} /> AI MARKET INSIGHT
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{summary}</p>
            </div>
          )}
          
          <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Business Name</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Industry</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Contact Info</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Identity</th>
              </tr>
            </thead>
            <tbody>
              {results.map((biz, idx) => (
                <tr key={biz.id || `fallback-${idx}`} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: 600 }}>{biz.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{biz.location}</div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '100px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 500 }}>
                      {biz.industry}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {loadingLeads.has(biz.id) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.75rem' }}>
                        <Loader2 size={14} className="animate-spin" /> Deep scanning...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', color: biz.email ? 'white' : 'var(--muted-foreground)', alignItems: 'center' }}>
                          <Mail size={14} style={{ color: biz.email ? 'var(--primary)' : undefined }} />
                          <span style={{ fontSize: '0.78rem' }}>{biz.email || 'Analyzing...'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', color: biz.phone ? 'white' : 'var(--muted-foreground)', alignItems: 'center' }}>
                          <Phone size={14} style={{ color: biz.phone ? 'var(--primary)' : undefined }} />
                          <span style={{ fontSize: '0.78rem' }}>{biz.phone || 'Scraping socials...'}</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {biz.website ? (
                        <a 
                          href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}
                        >
                          <ExternalLink size={14} /> Visit Website
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>No URL found</span>
                      )}
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        SYNCED
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {results.length === 0 && !isScraping && (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--muted-foreground)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Database size={48} style={{ opacity: 0.2, margin: '0 auto' }} />
          </div>
          <h3>No leads discovered yet</h3>
          <p>Enter a keyword and location above to start scraping nearby businesses.</p>
        </div>
      )}
    </div>
  );
}
