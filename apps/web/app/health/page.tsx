export default function HealthPage() {
  const status = {
    status: "operational",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    services: {
      api: "ready",
      database: "ready",
      cache: "ready",
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="app-card p-8 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Status Systemu
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
            ✓ Operational
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Informacje ogólne
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Status:</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {status.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Wersja:</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {status.version}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Timestamp:</span>
                <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {status.timestamp}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Usługi
            </h2>
            <div className="space-y-2">
              {Object.entries(status.services).map(([service, state]) => (
                <div 
                  key={service}
                  className="flex justify-between items-center py-2 border-b" 
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <span className="capitalize" style={{ color: 'var(--text-tertiary)' }}>
                    {service}:
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    {state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <a 
              href="/" 
              className="btn-primary w-full text-center"
            >
              Powrót do strony głównej
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
