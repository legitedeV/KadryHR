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
    <div className="app-root-scale-wrapper bg-gradient-layout min-h-screen text-slate-800 dark:text-slate-100 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.14)_1px,_transparent_0)] bg-[length:36px_36px]" />

      <div className="app-root-scale flex relative" style={{ color: 'var(--text-primary)' }}>
        {/* Floating Particles Background */}
        <FloatingParticles count={6} minSize={60} maxSize={120} speed={0.4} />

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10 backdrop-blur-sm">
          <DemoBanner />
          <main className="flex-1 w-full pt-6 pb-10 px-4 sm:px-6 lg:px-10 animate-fade-in">
            <div
              className="max-w-6xl w-full mx-auto rounded-3xl p-4 sm:p-6 md:p-7 lg:p-8 shadow-xl"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-xl)',
                color: 'var(--text-primary)'
              }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
