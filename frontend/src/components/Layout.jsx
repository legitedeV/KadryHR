import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DemoBanner from './DemoBanner';
import FloatingParticles from './FloatingParticles';

const Layout = ({ children, title }) => {
  return (
    <div className="min-h-screen flex bg-surface-app text-text-primary transition-colors">
      {/* Floating Particles Background */}
      <FloatingParticles count={8} minSize={80} maxSize={160} speed={0.5} />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 min-h-screen backdrop-blur-sm">
        <DemoBanner />
        <TopBar title={title} />
        <main className="flex-1 max-w-7xl w-full mx-auto pt-6 pb-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
          <div className="rounded-3xl shadow-lg p-6 sm:p-8 border transition-colors bg-surface-raised border-border-soft shadow-theme/20 dark:shadow-black/30">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
