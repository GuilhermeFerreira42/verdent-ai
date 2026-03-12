import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Verdent AI | Tribunal de Ideias',
  description: 'Engenharia Agêntica: Do plano ao código verificado.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-50 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
