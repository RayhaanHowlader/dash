import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'APML Control Room',
  description: 'Enterprise-grade Asset Performance Management & Logistics Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-gray-300 bg-gradient-to-br from-[#ffffff] to-[#ffffff]`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
} 