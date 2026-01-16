export type LogoProposalConfig = {
  brandName: string;
  tagline?: string;
  symbol: "monogram" | "pulse" | "hex" | "shield";
  layout: "stacked" | "inline";
  typography: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildLogoSvg(config: LogoProposalConfig) {
  const width = 640;
  const height = 320;
  const padding = 48;
  const brandName = escapeText(config.brandName);
  const tagline = config.tagline ? escapeText(config.tagline) : "";
  const isStacked = config.layout === "stacked";
  const symbolX = isStacked ? width / 2 : padding + 80;
  const symbolY = isStacked ? 110 : height / 2;

  const symbolMarkup = (() => {
    switch (config.symbol) {
      case "pulse":
        return `
          <rect x="${symbolX - 48}" y="${symbolY - 48}" width="96" height="96" rx="24" fill="${config.primaryColor}" />
          <path d="M${symbolX - 28} ${symbolY}h12l6-18 10 36 8-18h12" stroke="${config.accentColor}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        `;
      case "hex":
        return `
          <polygon points="${symbolX},${symbolY - 52} ${symbolX + 45},${symbolY - 26} ${symbolX + 45},${symbolY + 26} ${symbolX},${symbolY + 52} ${symbolX - 45},${symbolY + 26} ${symbolX - 45},${symbolY - 26}" fill="${config.primaryColor}" />
          <circle cx="${symbolX}" cy="${symbolY}" r="18" fill="${config.accentColor}" />
        `;
      case "shield":
        return `
          <path d="M${symbolX - 46} ${symbolY - 52}h92v52c0 32-22 56-46 70-24-14-46-38-46-70z" fill="${config.primaryColor}" />
          <path d="M${symbolX - 18} ${symbolY - 6}h36v12c0 14-9 24-18 30-9-6-18-16-18-30z" fill="${config.accentColor}" />
        `;
      default:
        return `
          <circle cx="${symbolX}" cy="${symbolY}" r="52" fill="${config.primaryColor}" />
          <text x="${symbolX}" y="${symbolY + 14}" font-size="44" text-anchor="middle" font-family="${config.typography}, sans-serif" fill="#ffffff">${brandName.slice(0, 1)}</text>
        `;
    }
  })();

  const textX = isStacked ? width / 2 : padding + 180;
  const textAnchor = isStacked ? "middle" : "start";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
      <rect width="${width}" height="${height}" rx="48" fill="${config.secondaryColor}" />
      ${symbolMarkup}
      <text x="${textX}" y="${isStacked ? 210 : height / 2}" text-anchor="${textAnchor}" font-size="42" font-weight="600" font-family="${config.typography}, sans-serif" fill="${config.primaryColor}">${brandName}</text>
      ${tagline ? `<text x="${textX}" y="${isStacked ? 252 : height / 2 + 44}" text-anchor="${textAnchor}" font-size="18" font-family="${config.typography}, sans-serif" fill="${config.accentColor}">${tagline}</text>` : ""}
    </svg>
  `.trim();
}

export function buildLogoDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
