import '../globals.css'

export const metadata = {
  title: 'Aegis Security Auditor v2.0',
  description: 'Profesionální modul pro pasivní recon a bezpečnostní audity',
}

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  )
}
