import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TopBar from './components/TopBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CTSR - Gestione Turni',
  description: 'Sistema di gestione turni e risorse umane',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* TopBar */}
          <TopBar />

          {/* Main content */}
          <main className="container mx-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 