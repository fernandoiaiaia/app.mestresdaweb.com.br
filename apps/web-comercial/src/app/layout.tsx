import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Varela_Round } from 'next/font/google';
import { Toaster } from 'sonner';
import { ConfirmProvider } from '@/providers/confirm-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const valeraRound = Varela_Round({ subsets: ['latin'], weight: '400', variable: '--font-varela-round' });

export const metadata: Metadata = {
  title: 'ProposalAI | Mestres da Web',
  description: 'ProposalAI Login Portal',
  icons: { icon: "/branding/favicon-mdw.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${valeraRound.variable} font-sans antialiased text-white min-h-screen bg-[#0B0014]`} suppressHydrationWarning>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: { background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" },
          }}
        />
      </body>
    </html>
  );
}
