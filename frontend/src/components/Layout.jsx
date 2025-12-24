import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import DemoBanner from './DemoBanner';
import FloatingParticles from './FloatingParticles';

const useResponsiveScale = () => {
  useEffect(() => {
    const updateScale = () => {
      const baseWidth = 1280;
      const baseHeight = 900;

      const widthScale = window.innerWidth / baseWidth;
      const heightScale = window.innerHeight / baseHeight;
      const dynamicScale = Math.min(widthScale, heightScale);

      const clampedScale = Math.max(0.85, Math.min(1, Number(dynamicScale.toFixed(3))));

      document.documentElement.style.setProperty('--app-scale', clampedScale);
      document.documentElement.dataset.viewport = clampedScale < 0.98 ? 'mobile' : 'desktop';
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
};

const Layout = ({ children }) => {
  useResponsiveScale();

  return (
    <div className="min-h-screen bg-gradient-layout text-slate-800 dark:text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        background: `radial-gradient(circle at 12% 20%, rgba(var(--theme-primary-rgb),0.18), transparent 32%),
        radial-gradient(circle at 88% 12%, rgba(14,165,233,0.18), transparent 34%),
        radial-gradient(circle at 50% 80%, rgba(37,99,235,0.12), transparent 42%)`
      }} />

      <div className="app-root-scale flex relative" style={{ color: 'var(--text-primary)' }}>
        <FloatingParticles count={5} minSize={50} maxSize={110} speed={0.35} />
        <Sidebar />

        <div className="flex-1 flex flex-col relative z-10 backdrop-blur-sm">
          <DemoBanner />
          <main className="flex-1 w-full py-8 px-4 sm:px-6 lg:px-10 animate-fade-in">
            <div className="w-full max-w-7xl mx-auto space-y-6">
              <div
                className="rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.45)] bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl p-5 sm:p-7 lg:p-8"
                style={{
                  color: 'var(--text-primary)'
                }}
              >
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
