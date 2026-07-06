'use client';

import { useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTriggerEnvelope = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/docusign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName: name, signerEmail: email }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: `Success! Envelope dispatched. ID: ${data.envelopeId}` });
        setName('');
        setEmail('');
      } else {
        setResult({ success: false, message: data.error || 'Failed to dispatch document.' });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network communication failure occurred.';
      setResult({ success: false, message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7fafc', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1a202c', fontSize: '1.5rem' }}>Docusign Next.js POC</h2>
        <p style={{ margin: '0 0 1.5rem 0', color: '#718096', fontSize: '0.9rem' }}>Send a digital signature packet instantly using backend Server Context Pipelines.</p>
        
        <form onSubmit={handleTriggerEnvelope} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' }}>Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading} style={{ width: '100%', padding: '0.65rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="Jane Doe" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4a5568' }}>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} style={{ width: '100%', padding: '0.65rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} placeholder="jane.doe@example.com" />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: loading ? '#a0aec0' : '#3182ce', color: '#ffffff', border: 'none', padding: '0.75rem', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
            {loading ? 'Processing Pipeline...' : 'Generate & Send Envelope'}
          </button>
        </form>

        <button type="button" onClick={() => {
          setAuthLoading(true);
          window.location.href = '/api/docusign/auth/login';
        }} disabled={loading || authLoading} style={{ width: '100%', marginTop: '1rem', backgroundColor: authLoading ? '#a0aec0' : '#38a169', color: '#ffffff', border: 'none', padding: '0.75rem', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', cursor: authLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
          {authLoading ? 'Connecting to Docusign...' : 'Connect Docusign & Send Envelope'}
        </button>

        {result && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem', backgroundColor: result.success ? '#f0fff4' : '#fff5f5', border: `1px solid ${result.success ? '#c6f6d5' : '#fed7d7'}`, color: result.success ? '#22543d' : '#742a2a', wordBreak: 'break-word' }}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
