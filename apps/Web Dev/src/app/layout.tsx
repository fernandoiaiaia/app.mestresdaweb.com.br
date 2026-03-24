import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Varela_Round } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const valeraRound = Varela_Round({ subsets: ['latin'], weight: '400', variable: '--font-varela-round' });

export const metadata: Metadata = {
    title: 'ProposalAI Dev | Mestres da Web',
    description: 'Plataforma de Gestão de Projetos - Time Interno',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark">
            <body className={`${inter.variable} ${spaceGrotesk.variable} ${valeraRound.variable} font-sans antialiased text-white min-h-screen bg-[#0B0014]`} suppressHydrationWarning>
                {children}
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
