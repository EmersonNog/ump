import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Montserrat } from "next/font/google";
import { RegistrarServiceWorker } from "@/components/registrar-sw";
import { SincronizarTema } from "@/components/tema";
import { SCRIPT_TEMA } from "@/lib/tema";
import "./globals.css";

// Montserrat (a letra dos cartazes da UMP) só em títulos e valores; Hanken Grotesk no restante da interface.
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["600", "700", "800", "900"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "UMP Jóquei", template: "%s · UMP Jóquei" },
  description: "Informe mensalidades e pagamentos de eventos da UMP Jóquei.",
  applicationName: "UMP Jóquei",
  appleWebApp: { capable: true, title: "UMP Jóquei", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f4f5f8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-tema="claro"
      suppressHydrationWarning
      className={`${montserrat.variable} ${hanken.variable} h-full antialiased`}
    >
      <head>
        {/* Aplica o tema salvo antes da primeira pintura. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <RegistrarServiceWorker />
        <SincronizarTema />
      </body>
    </html>
  );
}
