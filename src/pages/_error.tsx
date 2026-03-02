import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
          {statusCode}
        </h1>
        <p style={{ color: '#666', marginTop: '1rem' }}>
          {statusCode === 404
            ? 'Esta página no existe'
            : 'Ha ocurrido un error en el servidor'}
        </p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.75rem 2rem',
            backgroundColor: '#1e3a5f',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '9999px',
            fontWeight: 500,
          }}
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode: statusCode || 500 };
};

export default Error;
