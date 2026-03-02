import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: '#1e3a5f',
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '1.5rem',
            color: '#1e3a5f',
            marginTop: '1rem',
            marginBottom: '0.5rem',
          }}
        >
          Página no encontrada
        </h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            backgroundColor: '#1e3a5f',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '9999px',
            fontWeight: 500,
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
