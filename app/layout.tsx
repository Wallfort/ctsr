'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Home, Settings, Calendar } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SelectorProvider, useSelector } from '@/lib/context/selector-context';

const inter = Inter({ subsets: ['latin'] });

function Navigation() {
  const { selectedSection, setSelectedSection } = useSelector();
  const pathname = usePathname();
  const showSelectors = pathname === '/' || pathname === '/pianificazione';

  return (
    <>
      {/* Barra di navigazione principale */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">CTSR</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "h-16 px-4 border-b-2 border-transparent hover:border-gray-300 hover:bg-gray-50",
                      pathname === '/' && "border-primary"
                    )}
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link href="/pianificazione">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "h-16 px-4 border-b-2 border-transparent hover:border-gray-300 hover:bg-gray-50",
                      pathname === '/pianificazione' && "border-primary"
                    )}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Pianificazione
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "h-16 px-4 border-b-2 border-transparent hover:border-gray-300 hover:bg-gray-50",
                      pathname === '/admin' && "border-primary"
                    )}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Amministrazione
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Barra dei selettori - mostrata nella home e nella pianificazione */}
      {showSelectors && (
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14">
              <div className="flex space-x-4">
                <Button 
                  variant={selectedSection === 'stazioni' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setSelectedSection('stazioni')}
                  className={cn(
                    "h-14 px-4 font-medium transition-colors",
                    selectedSection === 'stazioni' 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-gray-100"
                  )}
                >
                  Stazioni
                </Button>
                <Button 
                  variant={selectedSection === 'fermate' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setSelectedSection('fermate')}
                  className={cn(
                    "h-14 px-4 font-medium transition-colors",
                    selectedSection === 'fermate' 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-gray-100"
                  )}
                >
                  Fermate
                </Button>
                <Button 
                  variant={selectedSection === 'pl' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setSelectedSection('pl')}
                  className={cn(
                    "h-14 px-4 font-medium transition-colors",
                    selectedSection === 'pl' 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-gray-100"
                  )}
                >
                  PL
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="it">
      <body className={inter.className}>
        <SelectorProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className={cn(
              "py-6",
              isHomePage ? "px-2" : "max-w-7xl mx-auto sm:px-6 lg:px-8"
            )}>
              {children}
            </main>
          </div>
        </SelectorProvider>
      </body>
    </html>
  );
} 