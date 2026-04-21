"use client";

import { useState } from "react";
import { 
  Database, 
  Terminal, 
  Play, 
  Trash2, 
  BarChart, 
  Search, 
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DatabaseConsole() {
  const [collection, setCollection] = useState("leads");
  const [method, setMethod] = useState("find");
  const [filter, setFilter] = useState("{}");
  const [update, setUpdate] = useState("{}");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCommand = async (customConfig?: any) => {
    setLoading(true);
    setError(null);
    try {
      const config = customConfig || {
        collection,
        method,
        filter: JSON.parse(filter),
        update: method.includes('Update') || method === 'distinct' ? JSON.parse(update) : {}
      };

      const response = await fetch('/api/database/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.result);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid JSON input');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { name: 'Count Leads', icon: <BarChart size={16} />, cmd: { method: 'countDocuments', collection: 'leads', filter: {} } },
    { name: 'Latest Scrapes', icon: <History size={16} />, cmd: { method: 'find', collection: 'scrapes', options: { limit: 5, sort: { timestamp: -1 } } } },
    { name: 'Clear History', icon: <Trash2 size={16} />, cmd: { method: 'deleteMany', collection: 'scrapes', filter: {} }, danger: true },
    { name: 'Get Indexes', icon: <Search size={16} />, cmd: { method: 'getIndexes', collection: 'leads' } },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Database Console</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Direct MongoDB interface. Execute commands against your lead collections.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Command Editor */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
             <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>COLLECTION</label>
                <select 
                  className="input-field" 
                  value={collection} 
                  onChange={(e) => setCollection(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="leads">leads</option>
                  <option value="scrapes">scrapes</option>
                  <option value="users">users</option>
                </select>
             </div>
             <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>METHOD</label>
                <select 
                  className="input-field" 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="find">find()</option>
                  <option value="findOne">findOne()</option>
                  <option value="countDocuments">countDocuments()</option>
                  <option value="updateOne">updateOne()</option>
                  <option value="updateMany">updateMany()</option>
                  <option value="deleteOne">deleteOne()</option>
                  <option value="deleteMany">deleteMany()</option>
                  <option value="distinct">distinct()</option>
                  <option value="aggregate">aggregate()</option>
                </select>
             </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>
              {method === 'aggregate' ? 'PIPELINE (JSON Array)' : method === 'distinct' ? 'FIELD NAME' : 'FILTER / QUERY (JSON)'}
            </label>
            <textarea 
              className="input-field"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem' }}
              placeholder={method === 'distinct' ? '"email"' : '{"status": "scraped"}'}
            />
          </div>

          {(method.includes('Update') || method === 'distinct') && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>
                {method === 'distinct' ? 'FILTER (JSON)' : 'UPDATE OPERATOR (JSON)'}
              </label>
              <textarea 
                className="input-field"
                value={update}
                onChange={(e) => setUpdate(e.target.value)}
                style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                placeholder='{"$set": {"status": "contacted"}}'
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <button 
               onClick={() => { setFilter("{}"); setUpdate("{}"); setResults(null); }}
               className="btn-secondary" 
               style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
             >
                <RotateCcw size={16} /> Reset
             </button>
             <button 
               onClick={() => runCommand()}
               className="btn-primary" 
               style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 2rem' }}
               disabled={loading}
             >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                Execute
             </button>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
             <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>Quick Actions</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {quickActions.map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => runCommand(action.cmd)}
                    className="btn-secondary"
                    style={{ 
                      justifyContent: 'flex-start', 
                      gap: '0.75rem', 
                      padding: '0.75rem',
                      border: action.danger ? '1px solid rgba(239, 68, 68, 0.2)' : undefined,
                      color: action.danger ? '#ef4444' : undefined
                    }}
                  >
                    {action.icon}
                    {action.name}
                  </button>
                ))}
             </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Security Warning</span>
             </div>
             <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
               Commands are executed directly against the production database. Avoid running <code>deleteMany({"\{\}"})</code> unless you intend to wipe a collection.
             </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {(results || error) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card" 
            style={{ marginTop: '2rem', overflow: 'hidden' }}
          >
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                  <Terminal size={18} /> Query Results
               </div>
               {error ? (
                 <div style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={14} /> Execution Failed
                 </div>
               ) : (
                 <div style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={14} /> Success
                 </div>
               )}
            </div>
            <div style={{ padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
               {error ? (
                  <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {error}
                  </div>
               ) : (
                  <pre style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem', 
                    color: '#10b981',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '1rem',
                    borderRadius: '8px',
                    margin: 0
                  }}>
                    {JSON.stringify(results, null, 2)}
                  </pre>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
