import React from 'react';
import Sidebar from './Sidebar';
import DemoBanner from './DemoBanner';
import FloatingParticles from './FloatingParticles';

const Layout = ({ children }) => {
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
          <main className="flex-1 w-full pt-6 pb-8 px-4 sm:px-6 lg:px-8 xl:px-10 animate-fade-in">
            <div 
              className="max-w-[1280px] mx-auto rounded-2xl p-4 sm:p-6"
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
