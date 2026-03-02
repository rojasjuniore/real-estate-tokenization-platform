'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#1e3a5f',
            marginBottom: '1rem',
          }}
        >
          Algo salió mal
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#1e3a5f',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
