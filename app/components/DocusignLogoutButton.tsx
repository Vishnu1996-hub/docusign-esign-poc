// Plain link (not a client component) since logging out is just a GET
// navigation to /api/docusign/auth/logout -- no client state needed.
export default function DocusignLogoutButton() {
  return (
    <a
      href="/api/docusign/auth/logout"
      style={{
        display: 'inline-block',
        marginBottom: '1.5rem',
        padding: '0.5rem 0.9rem',
        borderRadius: '6px',
        border: '1px solid #fed7d7',
        color: '#742a2a',
        backgroundColor: '#fff5f5',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}
    >
      Logout of DocuSign
    </a>
  );
}
