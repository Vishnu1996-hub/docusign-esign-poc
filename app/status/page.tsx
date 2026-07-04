'use client';

import { useEffect, useState } from 'react';
import DocusignLogoutButton from '@/app/components/DocusignLogoutButton';

type StatusResult = {
  status?: string;
  envelopeId?: string;
  error?: string;
  [key: string]: unknown;
};

export default function EnvelopeStatusPage() {
  const [envelopeId, setEnvelopeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);

  async function checkStatus(id: string) {
    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(`/api/docusign/status/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || 'Failed to fetch envelope status' });
        return;
      }

      setResult(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch envelope status';
      setResult({ error: message });
    } finally {
      setLoading(false);
    }
  }

  // Arriving from the "Check signing status" link on /send-envelope --
  // prefill and check immediately instead of making the user retype the ID.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('envelopeId');
    if (id) {
      setTimeout(() => {
        setEnvelopeId(id);
        checkStatus(id);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCheckStatus(e: React.FormEvent) {
    e.preventDefault();
    checkStatus(envelopeId);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7fafc',
        fontFamily: 'sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '560px',
        }}
      >
        <DocusignLogoutButton />

        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1a202c', fontSize: '1.6rem' }}>
          Envelope Status
        </h2>

        <p style={{ margin: '0 0 1.5rem 0', color: '#718096', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Check the current DocuSign status of an envelope using its envelope ID.
        </p>

        <form onSubmit={handleCheckStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Envelope ID</label>
            <input
              type="text"
              required
              value={envelopeId}
              onChange={(e) => setEnvelopeId(e.target.value)}
              disabled={loading}
              style={inputStyle}
              placeholder="Enter envelope ID"
            />
          </div>

          <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
            {loading ? 'Checking Status...' : 'Check Envelope Status'}
          </button>
        </form>

        {result && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '6px',
              fontSize: '0.92rem',
              backgroundColor: result.error ? '#fff5f5' : '#f0fff4',
              border: `1px solid ${result.error ? '#fed7d7' : '#c6f6d5'}`,
              color: result.error ? '#742a2a' : '#22543d',
              wordBreak: 'break-word',
            }}
          >
            {result.error ? (
              <div>
                <strong>Status lookup failed.</strong>
                <div style={{ marginTop: '0.4rem' }}>{result.error}</div>
              </div>
            ) : (
              <div>
                <div><strong>Envelope status fetched successfully.</strong></div>
                <div style={{ marginTop: '0.5rem' }}>
                  <div><strong>Envelope ID:</strong> {result.envelopeId}</div>
                  <div><strong>Status:</strong> {result.status}</div>
                </div>

                <details style={{ marginTop: '0.75rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                    View full response
                  </summary>
                  <pre
                    style={{
                      marginTop: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.82rem',
                      background: '#f7fafc',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      color: '#2d3748',
                    }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#4a5568',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e0',
  boxSizing: 'border-box',
  fontSize: '0.95rem',
};

const primaryButtonStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%',
  backgroundColor: loading ? '#a0aec0' : '#3182ce',
  color: '#ffffff',
  border: 'none',
  padding: '0.85rem',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'background-color 0.2s',
  marginTop: '0.25rem',
});