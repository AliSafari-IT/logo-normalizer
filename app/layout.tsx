import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ASafariM Logo Normalizer',
  description: 'Normalize and resize logos for consistent display',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
