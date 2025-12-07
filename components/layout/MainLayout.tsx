'use client';

import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <main className="pt-16 lg:ml-64 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
