import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/navbar'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ArremataMarília — Marketplace de Lances de Marília/SP',
  description: 'Compre e venda em Marília com sistema de lances em tempo real.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
