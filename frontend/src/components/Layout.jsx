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
    <div className="app-root-scale-wrapper bg-gradient-layout min-h-screen">
      <div className="app-root-scale flex" style={{ color: 'var(--text-primary)' }}>
        {/* Floating Particles Background */}
        <FloatingParticles count={8} minSize={80} maxSize={160} speed={0.5} />

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10 backdrop-blur-sm">
          <DemoBanner />
          <main className="flex-1 w-full pt-6 pb-10 px-3 sm:px-5 lg:px-8 xl:px-10 animate-fade-in">
            <div
              className="max-w-[1280px] w-full mx-auto rounded-2xl p-4 sm:p-5 md:p-6"
              style={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-lg)',
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
