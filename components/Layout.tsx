
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <header className="bg-indigo-600 px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
            <i className="fas fa-graduation-cap"></i>
            Smart Vocab Trainer
          </h1>
          <p className="text-indigo-100 mt-2 font-medium">英単語マスターへの道</p>
        </header>
        <main className="p-6 sm:p-10">
          {children}
        </main>
      </div>
      <footer className="mt-8 text-slate-400 text-sm font-medium">
        © 2024 Vocabulary Mastery Inc.
      </footer>$ npm install gh-pages --save-dev
    </div>
  );
};

