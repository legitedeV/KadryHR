import React from 'react';
import Sidebar from './Sidebar';
import DemoBanner from './DemoBanner';
import FloatingParticles from './FloatingParticles';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gradient-layout">
      {/* Floating Particles Background */}
      <FloatingParticles count={8} minSize={80} maxSize={160} speed={0.5} />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 min-h-screen">
        <DemoBanner />
        <main className="flex-1 max-w-7xl w-full mx-auto pt-6 pb-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
