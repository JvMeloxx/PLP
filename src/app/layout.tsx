import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arena PLP - Gestão de Presença",
  description: "Confirmação de presença e lista de espera para o futevôlei da Arena PLP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-arena-black text-white">
        {children}
      </body>
    </html>
  );
}
