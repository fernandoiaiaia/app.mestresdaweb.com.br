import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Varela_Round } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const varelaRound = Varela_Round({ subsets: ['latin'], weight: '400', variable: '--font-varela-round' });

export const metadata: Metadata = {
  title: 'ProposalAI | Portal do Cliente',
  description: 'Portal do Cliente — Cezani',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${varelaRound.variable} font-sans antialiased text-white min-h-screen bg-[#0B0014]`}>
        {children}
      </body>
    </html>
  );
}
