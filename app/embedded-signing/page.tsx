'use client';

import { useEffect, useState } from 'react';
import DocusignLogoutButton from '@/app/components/DocusignLogoutButton';

type SigningResult = {
  url?: string;
  error?: string;
};

export default function EmbeddedSigningPage() {
  const [envelopeId, setEnvelopeId] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [clientUserId, setClientUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SigningResult | null>(null);

  // Arriving from the "Continue to embedded signing" link on /send-envelope --
  // prefill with the exact envelopeId/clientUserId used when the envelope was
  // created, since DocuSign requires those to match for a captive recipient.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnvelopeId((prev) => params.get('envelopeId') || prev);
    setSignerName((prev) => params.get('signerName') || prev);
    setSignerEmail((prev) => params.get('signerEmail') || prev);
    setClientUserId((prev) => params.get('clientUserId') || prev);
  }, []);

  async function handleCreateSigningUrl(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/docusign/embedded-signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envelopeId,
          signerName,
          signerEmail,
          clientUserId,
          // Land back on the real status page for this envelope instead of a
          // placeholder route -- DocuSign appends its own `event` param (e.g.
          // signing_complete/decline/cancel) after whatever query string we
          // already have, so envelopeId survives the round trip intact.
          returnUrl: `${window.location.origin}/status?envelopeId=${encodeURIComponent(envelopeId)}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || 'Failed to generate signing URL' });
        return;
      }

      setResult({ url: data.url });

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      setResult({ error: error.message || 'Failed to generate signing URL' });
    } finally {
      setLoading(false);
    }
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
          Embedded Signing
        </h2>

        <p style={{ margin: '0 0 1.5rem 0', color: '#718096', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Generate a DocuSign recipient signing URL for an existing envelope.
          <br />
          Use the same signer name, email and client user ID that were used while sending the envelope.
        </p>

        <form onSubmit={handleCreateSigningUrl} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <div>
            <label style={labelStyle}>Signer Name</label>
            <input
              type="text"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              disabled={loading}
              style={inputStyle}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label style={labelStyle}>Signer Email</label>
            <input
              type="email"
              required
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              disabled={loading}
              style={inputStyle}
              placeholder="jane.doe@example.com"
            />
          </div>

          <div>
            <label style={labelStyle}>Client User ID</label>
            <input
              type="text"
              required
              value={clientUserId}
              onChange={(e) => setClientUserId(e.target.value)}
              disabled={loading}
              style={inputStyle}
              placeholder="1001"
            />
          </div>

          <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
            {loading ? 'Generating Signing URL...' : 'Generate Signing URL'}
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
                <strong>Embedded signing failed.</strong>
                <div style={{ marginTop: '0.4rem' }}>{result.error}</div>
              </div>
            ) : (
              <div>
                <div><strong>Signing URL created successfully.</strong></div>
                {result.url && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2b6cb0', textDecoration: 'underline' }}
                    >
                      Open Signing Session
                    </a>
                  </div>
                )}
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