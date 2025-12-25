import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="app-card p-8 max-w-2xl w-full mx-4">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          KadryHR V2
        </h1>
        <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
          Witamy w nowej wersji systemu zarządzania zasobami ludzkimi
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/health" 
            className="btn-primary block text-center"
          >
            Sprawdź status systemu
          </Link>
          
          <Link 
            href="/login" 
            className="btn-primary block text-center"
          >
            Zaloguj się
          </Link>
          
          <Link 
            href="/schedule-builder" 
            className="btn-primary block text-center"
          >
            Kreator grafików
          </Link>
        </div>
      </div>
    </div>
  );
}
