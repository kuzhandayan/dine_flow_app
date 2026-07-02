import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f97316',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  title: {
    default: 'DineFlow — Restaurant POS & Management Software India',
    template: '%s | DineFlow',
  },
  description:
    'DineFlow is a cloud-based Restaurant POS and Management SaaS for Indian restaurants. GST billing, order management, inventory tracking, staff roles, and analytics — all in one platform. Built by Kuzhandayan K V.',
  keywords: [
    'restaurant POS India',
    'restaurant management software',
    'GST billing software restaurant',
    'cloud POS India',
    'restaurant billing software',
    'multi-tenant restaurant SaaS',
    'DineFlow POS',
    'dine-in order management',
    'restaurant inventory software',
    'CGST SGST billing',
    'restaurant staff management',
    'Kuzhandayan',
    'Kuzhandayan K V',
    'sabbari',
    'DineFlow',
  ],
  authors: [{ name: 'Kuzhandayan K V', url: 'mailto:sabbari.kv013@gmail.com' }],
  creator: 'Kuzhandayan K V',
  publisher: 'DineFlow',
  category: 'Restaurant Software',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
    siteName: 'DineFlow',
    title: 'DineFlow — Restaurant POS & Management Software India',
    description:
      'Cloud-based Restaurant POS for Indian restaurants. GST billing, orders, inventory, staff roles & analytics. Start managing your restaurant smarter.',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'DineFlow — Restaurant POS' }],
  },
  twitter: {
    card: 'summary',
    title: 'DineFlow — Restaurant POS & Management Software India',
    description:
      'Cloud-based Restaurant POS for Indian restaurants. GST billing, orders, inventory, staff management & analytics.',
    images: ['/icon.png'],
  },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '512x512' }],
    shortcut: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('dineflow-theme');if(t==='light')document.documentElement.classList.add('light');})()`,
          }}
        />
      </head>
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
