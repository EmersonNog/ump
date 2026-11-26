import QRCode from "qrcode";

/** QR Code do Pix em SVG, gerado no servidor a partir do "copia e cola". */
export async function QrPix({ codigo, className }: { codigo: string; className?: string }) {
  const svg = await QRCode.toString(codigo, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#0b3220", light: "#ffffff" } });
  return (
    <div
      role="img"
      aria-label="QR Code Pix"
      className={className}
      // SVG gerado pela biblioteca a partir do nosso próprio código Pix (sem HTML de terceiros).
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
