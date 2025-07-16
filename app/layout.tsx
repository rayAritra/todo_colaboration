import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Colaborative Todo Board',
  description: 'Created By aritraray',
  generator: 'aritraray',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
