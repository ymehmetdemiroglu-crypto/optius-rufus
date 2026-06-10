import type { JSX } from 'react';

function isValidCssColor(color: string): boolean {
  const safeKeywords = ['transparent', 'inherit', 'initial', 'unset'];
  if (safeKeywords.includes(color.toLowerCase())) return true;
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
}

function isValidDataUrl(url: string): boolean {
  return /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/.test(url);
}

interface BrandStyleInjectorProps {
  brandData: { primaryColor?: string; logoBase64?: string };
}

export default function BrandStyleInjector({ brandData }: BrandStyleInjectorProps): JSX.Element {
  const safeColor = brandData.primaryColor && isValidCssColor(brandData.primaryColor)
    ? brandData.primaryColor
    : "#b8860b";
  const safeLogo = brandData.logoBase64 && isValidDataUrl(brandData.logoBase64)
    ? brandData.logoBase64
    : null;

  const css = `
    :root { --brand-gold: ${safeColor} !important; }
    .bg-brand-gold, .progress-segment.active, .gauge-bar-fill.score-warning {
      background-color: ${safeColor} !important;
    }
    .text-brand-gold, .price-token { color: ${safeColor} !important; }
    .border-brand-gold { border-color: ${safeColor} !important; }
    ${safeLogo ? `.agency-logo-placeholder {
      background-image: url(${safeLogo}) !important;
      background-size: contain; background-repeat: no-repeat;
    }` : ""}
    @media print {
      body { background-color: #f5f0e8 !important; color: #1a1a1a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      #stage-hero, #stage-autopsy, #stage-bleed, #stage-simulator, #stage-transform, #stage-free-qas, #stage-ppc-planner, #stage-bundling, #stage-roadmap, #stage-proof {
        page-break-inside: avoid !important; break-inside: avoid !important;
        margin-bottom: 2rem !important; page-break-after: auto !important;
      }
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
