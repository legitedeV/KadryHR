import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DemoBanner from './DemoBanner';
import FloatingParticles from './FloatingParticles';

const Layout = ({ children, title }) => {
  return (
    <div className="app-root-scale-wrapper bg-gradient-layout">
      <div className="app-root-scale min-h-screen flex" style={{ color: 'var(--text-primary)' }}>
        {/* Floating Particles Background */}
        <FloatingParticles count={8} minSize={80} maxSize={160} speed={0.5} />
        
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10 min-h-screen backdrop-blur-sm">
          <DemoBanner />
          <TopBar title={title} />
          <main className="flex-1 w-full pt-4 pb-6 px-4 sm:px-6 lg:px-8 xl:px-10 animate-fade-in">
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
