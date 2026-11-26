import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "UMP · Pagamentos", template: "%s · UMP" },
  description: "Informe mensalidades e pagamentos de eventos da Mocidade Presbiteriana.",
  applicationName: "UMP Pagamentos",
  appleWebApp: { capable: true, title: "UMP", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#155637" },
    { media: "(prefers-color-scheme: dark)", color: "#07130d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${lora.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
