'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Home, Settings, Calendar } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SelectorProvider, useSelector } from '@/lib/context/selector-context';
import { useState, useEffect } from 'react';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';

const inter = Inter({ subsets: ['latin'] });

function Navigation() {
  const { selectedMansioneId, setSelectedMansioneId } = useSelector();
  const pathname = usePathname();
  const showSelectors = pathname === '/' || pathname === '/pianificazione';
  const [mansioni, setMansioni] = useState<Mansione[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMansioni() {
      try {
        const data = await mansioniService.getAll();
        const mansioniAttive = data.filter(m => m.stato === 'attivo');
        setMansioni(mansioniAttive);
      } catch (error) {
        console.error('Errore nel caricamento delle mansioni:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMansioni();
  }, []);

  return (
    <>
      {/* Barra di navigazione principale */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <Home className="h-5 w-5" />
                <span className="ml-2">Home</span>
              </Link>
              <Link href="/pianificazione" className="ml-8 flex items-center">
                <Calendar className="h-5 w-5" />
                <span className="ml-2">Pianificazione</span>
              </Link>
              <Link href="/admin" className="ml-8 flex items-center">
                <Settings className="h-5 w-5" />
                <span className="ml-2">Admin</span>
              </Link>
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
                {isLoading ? (
                  <div className="flex items-center h-14 px-4">Caricamento...</div>
                ) : (
                  mansioni.map((mansione) => (
                    <Button 
                      key={mansione.id}
                      variant={selectedMansioneId === mansione.id ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setSelectedMansioneId(mansione.id)}
                      className={cn(
                        "h-14 px-4 font-medium transition-colors",
                        selectedMansioneId === mansione.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      {mansione.nome}
                    </Button>
                  ))
                )}
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