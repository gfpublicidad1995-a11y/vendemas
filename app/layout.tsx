import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tipografía de marca: títulos y wordmark con carácter (cálida y confiada).
const brandDisplay = Bricolage_Grotesque({
  variable: "--font-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VendeMás — Tu agencia de contenido y anuncios por WhatsApp",
  description:
    "Vos atendé tu negocio. Nosotros creamos el contenido, los anuncios y las ideas para vender más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${brandDisplay.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
