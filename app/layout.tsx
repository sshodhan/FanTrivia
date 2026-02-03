import React from "react"
import type { Metadata, Viewport } from 'next'
import { Oswald, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const oswald = Oswald({ 
  subsets: ["latin"],
  variable: '--font-heading'
});
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: 'Hawktrivia - Seahawks Super Bowl Trivia',
  description: 'Test your knowledge of Seahawks Super Bowl history! Compete with fellow 12s in daily trivia challenges.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#001f3f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${oswald.variable} ${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
