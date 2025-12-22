import React from 'react';
import Navbar from './Navbar';
import DemoBanner from './DemoBanner';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-rose-50/30">
      <DemoBanner />
      <Navbar />
      <main className="max-w-6xl mx-auto pt-6 pb-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;
