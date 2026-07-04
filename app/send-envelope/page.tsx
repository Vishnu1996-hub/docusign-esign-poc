'use client';

import { useState } from 'react';
import DocusignLogoutButton from '@/app/components/DocusignLogoutButton';

type EnvelopeResponse = {
  envelopeId?: string;
  status?: string;
  clientUserId?: string;
  error?: string;
};

export default function SendEnvelopePage() {
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [subject, setSubject] = useState('Please sign this document');
  const [message, setMessage] = useState('Please review and sign the attached document.');
  const [file, setFile] = useState<File | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnvelopeResponse | null>(null);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const output = reader.result as string;
        resolve(output.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setResult({ error: 'Please upload a file before sending the envelope.' });
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const documentBase64 = await fileToBase64(file);

      const response = await fetch('/api/docusign/send-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName,
          signerEmail,
          subject,
          message,
          documentBase64,
          fileName: file.name,
          // Signer's email doubles as a simple, stable clientUserId -- DocuSign
          // only needs it to be unique per signer, not any particular format.
          clientUserId: embedded ? signerEmail : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || 'Failed to send envelope' });
        return;
      }

      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message || 'Failed to send envelope' });
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
          maxWidth: '620px',
        }}
      >
        <DocusignLogoutButton />

        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1a202c', fontSize: '1.6rem' }}>
          Send DocuSign Envelope
        </h2>

        <p style={{ margin: '0 0 1.5rem 0', color: '#718096', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Upload a document and send it for signature through DocuSign.
          <br />
          The document should contain the anchor text <strong>/sn1/</strong> where the signature needs to appear.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <label style={labelStyle}>Email Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              style={inputStyle}
              placeholder="Please sign this document"
            />
          </div>

          <div>
            <label style={labelStyle}>Email Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Please review and sign the attached document."
            />
          </div>

          <div>
            <label style={labelStyle}>Upload Document</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
              style={fileInputStyle}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#718096' }}>
              Supported formats: PDF, DOC, DOCX
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4a5568' }}>
            <input type="checkbox" checked={embedded} onChange={(e) => setEmbedded(e.target.checked)} disabled={loading} />
            Embedded signing (skip the email, sign inside this app)
          </label>

          <button type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
            {loading ? 'Sending Envelope...' : 'Generate & Send Envelope'}
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
                <strong>Envelope creation failed.</strong>
                <div style={{ marginTop: '0.4rem' }}>{result.error}</div>
              </div>
            ) : (
              <div>
                <div><strong>Envelope created successfully.</strong></div>
                <div style={{ marginTop: '0.5rem' }}>
                  <div><strong>Envelope ID:</strong> {result.envelopeId}</div>
                  <div><strong>Status:</strong> {result.status}</div>
                </div>
                {result.envelopeId && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {result.clientUserId && (
                      <a
                        href={`/embedded-signing?${new URLSearchParams({
                          envelopeId: result.envelopeId,
                          clientUserId: result.clientUserId,
                          signerName,
                          signerEmail,
                        }).toString()}`}
                        style={{ color: '#2b6cb0', textDecoration: 'underline' }}
                      >
                        Continue to embedded signing
                      </a>
                    )}
                    <a
                      href={`/status?envelopeId=${encodeURIComponent(result.envelopeId)}`}
                      style={{ color: '#2b6cb0', textDecoration: 'underline' }}
                    >
                      Check signing status
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

const fileInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e0',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
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