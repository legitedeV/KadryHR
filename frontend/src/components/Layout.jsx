import React from 'react';
import Navbar from './Navbar';
import DemoBanner from './DemoBanner';
import FloatingParticles from './FloatingParticles';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen relative" style={{
      background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-primary) 3%, white), white, color-mix(in srgb, var(--theme-secondary) 3%, white))'
    }}>
      {/* Floating Particles Background */}
      <FloatingParticles count={8} minSize={80} maxSize={160} speed={0.5} />
      
      <div className="relative z-10">
        <DemoBanner />
        <Navbar />
        <main className="max-w-6xl mx-auto pt-6 pb-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
