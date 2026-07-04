'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DocusignErrorPage() {
  // window is unavailable during Next.js's server-side prerender pass, so the
  // query string must be read in an effect (client-only, post-mount), not in
  // a useState initializer (which also runs during that server render).
  const [message, setMessage] = useState('DocuSign connection failed.');

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('message');
    if (fromQuery) setMessage(fromQuery);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7fafc', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '460px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#742a2a', fontSize: '1.5rem' }}>DocuSign connection failed</h2>
        <p style={{ margin: '0 0 1.5rem 0', color: '#4a5568', fontSize: '0.9rem', wordBreak: 'break-word' }}>{message}</p>
        <Link href="/" style={{ color: '#3182ce', fontSize: '0.9rem', fontWeight: 600 }}>Back to app</Link>
      </div>
    </div>
  );
}
