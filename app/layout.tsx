import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Merry - Digital Chama Platform',
  description:
    'Manage your chamas (savings groups) digitally. Track contributions, manage cycles, and ensure transparency in your merry-go-round groups.',
  keywords: ['chama', 'savings group', 'merry-go-round', 'rotating savings', 'kenya'],
  authors: [{ name: 'Merry Team' }],
  openGraph: {
    title: 'Merry - Digital Chama Platform',
    description:
      'Manage your chamas (savings groups) digitally. Track contributions, manage cycles, and ensure transparency.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merry - Digital Chama Platform',
    description:
      'Manage your chamas (savings groups) digitally. Track contributions, manage cycles, and ensure transparency.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} ${outfit.variable}`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
