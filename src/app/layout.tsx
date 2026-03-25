import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { AuthProvider } from '@/components/auth'
import { EncryptionProviderWrapper } from '@/components/encryption'
import { ThemeProvider } from '@/components/theme'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Postcards',
  description: 'A multi-tenant blogging system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <EncryptionProviderWrapper>
          <AuthProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </EncryptionProviderWrapper>
      </body>
    </html>
  )
}
