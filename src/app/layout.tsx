import type { Metadata, Viewport } from "next";
import "./globals.css";
import { atributoDoTema, temaAtual } from "@/lib/tema";

export const metadata: Metadata = {
  title: "Cidade Music",
  description: "Sistema de organização de eventos, repertório e finanças da Cidade Music",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Cidade Music",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // A barra do navegador acompanha a aparência de quem está olhando.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lido no servidor para a página já nascer na cor certa, sem piscar.
  const tema = await temaAtual();

  return (
    <html lang="pt-BR" {...atributoDoTema(tema)}>
      <body>{children}</body>
    </html>
  );
}
