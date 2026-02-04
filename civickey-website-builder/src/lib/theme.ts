import type { MunicipalityColors } from './types';

export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const R = num >> 16;
  const G = (num >> 8) & 0x00ff;
  const B = num & 0x0000ff;
  const newR = Math.round(R + (255 - R) * (percent / 100));
  const newG = Math.round(G + (255 - G) * (percent / 100));
  const newB = Math.round(B + (255 - B) * (percent / 100));
  return '#' + (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1);
}

export function generateThemeStyles(colors: MunicipalityColors): string {
  const primary = colors.primary || '#0D5C63';
  const primaryDark = colors.primaryDark || darkenColor(primary, 15);
  const primaryLight = colors.primaryLight || lightenColor(primary, 90);
  const accent = colors.accent || colors.secondary || '#F4A261';

  return [
    `--color-primary: ${primary}`,
    `--color-primary-dark: ${primaryDark}`,
    `--color-primary-light: ${primaryLight}`,
    `--color-accent: ${accent}`,
  ].join('; ');
}
