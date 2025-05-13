'use client';

import Link from 'next/link';
import { Home, Settings } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="h-16 bg-white shadow-md border-b">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
          >
            <Home size={20} />
            <span>Home</span>
          </Link>
        </div>
        <div>
          <Link
            href="/admin"
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
          >
            <Settings size={20} />
            <span>Amministrazione</span>
          </Link>
        </div>
      </div>
    </header>
  );
} 