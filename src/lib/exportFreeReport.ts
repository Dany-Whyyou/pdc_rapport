// Exports pour les rapports libres (contenu HTML Tiptap).
// Les exports du rapport bilan restent dans exportPdf.ts / exportWord.ts,
// ils utilisent une structure differente (tableaux par sous-section).

import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

// Feuille de style commune pour l'export imprimable — encapsule le HTML de Tiptap
// dans un layout A4 lisible aussi bien en PDF qu'en Word.
function buildPrintableHtml(titre: string, html: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(titre)}</title>
        <style>
          body { font-family: 'Calibri', 'Helvetica', 'Arial', sans-serif; color: #1f2937; line-height: 1.6; padding: 24px; }
          h1 { color: #1e3a8a; font-size: 22pt; margin: 24px 0 12px; }
          h2 { color: #1e3a8a; font-size: 16pt; margin: 20px 0 10px; }
          h3 { color: #334155; font-size: 13pt; margin: 16px 0 8px; }
          p  { font-size: 11pt; margin: 8px 0; }
          ul, ol { margin: 8px 0 8px 24px; padding: 0; }
          li { font-size: 11pt; margin: 4px 0; }
          blockquote { border-left: 3px solid #cbd5e1; padding-left: 12px; margin: 12px 0; color: #475569; font-style: italic; }
          a { color: #2563eb; text-decoration: underline; }
          strong { font-weight: 700; }
          em { font-style: italic; }
          u { text-decoration: underline; }
          s { text-decoration: line-through; }
          .doc-title { text-align: center; font-size: 24pt; font-weight: 800; color: #1e3a8a; margin: 0 0 8px; }
          .doc-sep { border: none; border-top: 2px solid #1e3a8a; margin: 12px 0 24px; }
        </style>
      </head>
      <body>
        <h1 class="doc-title">${escapeHtml(titre)}</h1>
        <hr class="doc-sep" />
        ${html}
      </body>
    </html>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'rapport';
}

export async function exportFreeReportWord(titre: string, html: string): Promise<void> {
  // Word ouvre nativement les fichiers .doc contenant du HTML avec les bons
  // headers MHT. Approche eprouvee et 100% browser-safe (pas de dependance
  // Node comme html-to-docx qui exige fs/crypto/path).
  //
  // On enveloppe l'HTML dans un doc "Word 2000+" avec un content-type MIME
  // approprie, ce qui declenche l'ouverture par Word sans avertissement.
  const inner = buildPrintableHtml(titre, html);
  const wordDoc = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_pdc"

------=_NextPart_pdc
Content-Location: file:///report.htm
Content-Transfer-Encoding: quoted-printable
Content-Type: text/html; charset="utf-8"

${inner}

------=_NextPart_pdc--`;

  const blob = new Blob([wordDoc], { type: 'application/msword' });
  saveAs(blob, `${slugify(titre)}.doc`);
}

export async function exportFreeReportPdf(titre: string, html: string): Promise<void> {
  // Injecte un container hors ecran pour laisser jsPDF.html() rendre proprement.
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // ~ A4 largeur a 96dpi (210mm)
  container.innerHTML = buildPrintableHtml(titre, html);
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    await pdf.html(container, {
      x: 0,
      y: 0,
      width: 595, // A4 en pt
      windowWidth: 794,
      autoPaging: 'text',
      margin: [40, 40, 40, 40],
    });
    pdf.save(`${slugify(titre)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
