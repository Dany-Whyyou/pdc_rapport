/**
 * Extracteur de couleurs depuis une image.
 * Retourne :
 *  - dark   : couleur sombre dominante (utilisee pour les textes principaux/dates)
 *  - accent : couleur chaude saturee dominante (or/amber/rouge - utilisee pour le doré)
 *  - bg     : couleur claire/cream derivee (fond de page)
 */
export type ExtractedColors = {
  dark: string;
  accent: string;
  bg: string;
};

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

/**
 * Extrait 3 couleurs d'une image via sampling.
 * Strategy:
 *  - dark   = pixel le plus sombre avec saturation correcte
 *  - accent = pixel le plus sature dans la zone warm (hue 30-60 priorisee, sinon 0-60)
 *  - bg     = pixel le plus clair, derivé en cream warm
 */
export async function extractColorsFromImage(imageSrc: string): Promise<ExtractedColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dark: '#1a2547', accent: '#c89a3f', bg: '#f4ede1' });
          return;
        }

        // Reduire pour echantillonnage rapide
        const w = 100;
        const h = Math.round((img.height / img.width) * w);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const data = ctx.getImageData(0, 0, w, h).data;

        const buckets: Record<string, { r: number; g: number; b: number; count: number; hsl: [number, number, number] }> = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 200) continue;
          // Reduire la precision (quantization)
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;
          const key = `${qr}_${qg}_${qb}`;
          if (!buckets[key]) {
            buckets[key] = { r: qr, g: qg, b: qb, count: 0, hsl: rgbToHsl(qr, qg, qb) };
          }
          buckets[key].count++;
        }

        const palette = Object.values(buckets).sort((a, b) => b.count - a.count);

        // Dark : meilleure couleur sombre (luminosite < 30%, suffisamment fréquente)
        const darkCandidates = palette.filter(c => c.hsl[2] < 35 && c.hsl[1] > 5);
        let dark = darkCandidates.length > 0 ? darkCandidates[0] : palette.find(c => c.hsl[2] < 50) || palette[0];

        // Garantir un noir-bleu suffisamment sombre
        if (dark.hsl[2] > 25) {
          // Force darken
          const factor = 0.4;
          dark = {
            ...dark,
            r: Math.round(dark.r * factor),
            g: Math.round(dark.g * factor),
            b: Math.round(dark.b * factor),
          };
        }

        // Accent : couleur warm la plus saturée (hue 20-65 prioritaire = jaune/or)
        const warmHues = palette.filter(c => {
          const [h, s, l] = c.hsl;
          return h >= 20 && h <= 65 && s > 25 && l > 30 && l < 75;
        });
        const otherSaturated = palette.filter(c => c.hsl[1] > 40 && c.hsl[2] > 30 && c.hsl[2] < 75);
        const accentCandidates = [...warmHues, ...otherSaturated];
        const accent = accentCandidates.length > 0
          ? accentCandidates.sort((a, b) => b.hsl[1] - a.hsl[1])[0]
          : { r: 200, g: 154, b: 63 };

        // Bg : cream warm derivee (pas tiree de l'image, look cohérent)
        const bg = { r: 244, g: 237, b: 225 };

        resolve({
          dark: rgbToHex(dark.r, dark.g, dark.b),
          accent: rgbToHex(accent.r, accent.g, accent.b),
          bg: rgbToHex(bg.r, bg.g, bg.b),
        });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => resolve({ dark: '#1a2547', accent: '#c89a3f', bg: '#f4ede1' });
    img.src = imageSrc;
  });
}

/**
 * Convertit un File en data URL base64
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
