import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BilanEntry {
  theme: string;
  sous_theme?: string;
  points_positifs: string;
  points_negatifs: string;
  propositions: string;
}

interface PlanEntry {
  numero_defi?: number;
  defi: string;
  action_a: string;
  action_b: string;
  action_c: string;
  action_d: string;
}

interface Section {
  nom: string;
  bilan: BilanEntry[];
  plan_action: PlanEntry[];
}

interface ReportData {
  titre: string;
  annee: number;
  trimestre: number;
  statut: string;
  sous_sections: Section[];
}

function trimestreLabel(t: number): string {
  const labels: Record<number, string> = {
    1: 'Janvier - Mars',
    2: 'Avril - Juin',
    3: 'Juillet - Septembre',
    4: 'Octobre - Décembre',
  };
  return labels[t] || `T${t}`;
}

function trimestreSuivant(t: number, annee: number): string {
  const next = t === 4 ? 1 : t + 1;
  const nextAnnee = t === 4 ? annee + 1 : annee;
  const labels: Record<number, string> = {
    1: 'Janvier-Février-Mars',
    2: 'Avril-Mai-Juin',
    3: 'Juillet-Août-Septembre',
    4: 'Octobre-Novembre-Décembre',
  };
  return `${labels[next]} ${nextAnnee}`;
}

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo-pdc.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addCoverPage(doc: jsPDF, report: ReportData, logoBase64: string | null) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fond bleu foncé en haut
  doc.setFillColor(26, 54, 93);
  doc.rect(0, 0, pageWidth, pageHeight * 0.45, 'F');

  // Bande dorée
  doc.setFillColor(212, 175, 55);
  doc.rect(0, pageHeight * 0.45, pageWidth, 4, 'F');

  // Logo
  if (logoBase64) {
    const logoSize = 60;
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoSize) / 2, 30, logoSize, logoSize);
  }

  // Titre "PORTE DES CIEUX"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('PORTE DES CIEUX', pageWidth / 2, 110, { align: 'center' });

  // Sous-titre "Ministère de Louange"
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Ministère de Louange', pageWidth / 2, 122, { align: 'center' });

  // Séparateur
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(pageWidth * 0.3, 132, pageWidth * 0.7, 132);

  // Type de rapport
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.text('RAPPORT DE BILAN', pageWidth / 2, 142, { align: 'center' });

  // Bas de page (fond blanc)
  // Titre du rapport
  doc.setTextColor(26, 54, 93);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const bilanTitle = `BILAN PDC ${report.trimestre}e TRIMESTRE`;
  doc.text(bilanTitle, pageWidth / 2, pageHeight * 0.55, { align: 'center' });

  // Période
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`(${trimestreLabel(report.trimestre)}) ${report.annee}`, pageWidth / 2, pageHeight * 0.62, { align: 'center' });

  // Sous-titre
  doc.setFontSize(13);
  doc.setTextColor(120, 120, 120);
  doc.text('Sous-Sections Confondues', pageWidth / 2, pageHeight * 0.68, { align: 'center' });

  // Pied de page
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text('Document confidentiel - Usage interne uniquement', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // Bande dorée en bas
  doc.setFillColor(26, 54, 93);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, pageHeight - 12, pageWidth, 2, 'F');
}

export async function generatePdf(report: ReportData, mode: 'view' | 'download' = 'download') {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoBase64 = await loadLogoAsBase64();

  // Page de garde
  addCoverPage(doc, report, logoBase64);

  // Pour chaque sous-section
  for (const section of report.sous_sections) {
    // ===== PAGE BILAN =====
    doc.addPage();

    // Header coloré
    doc.setFillColor(26, 54, 93);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 18, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`BILAN PDC ${report.trimestre}e TRIMESTRE (${trimestreLabel(report.trimestre)}) ${report.annee}`, pageWidth / 2, 12, { align: 'center' });

    // Titre sous-section
    doc.setTextColor(26, 54, 93);
    doc.setFontSize(14);
    doc.text(`Sous-Section ${section.nom}`, pageWidth / 2, 30, { align: 'center' });

    // Tableau bilan
    if (section.bilan.length > 0) {
      const bilanRows = section.bilan.map((b) => [
        `${b.theme}${b.sous_theme ? '\n' + b.sous_theme : ''}\n${b.points_positifs || ''}`,
        `${b.theme}${b.sous_theme ? '\n' + b.sous_theme : ''}\n${b.points_negatifs || ''}`,
        `${b.theme}${b.sous_theme ? '\n' + b.sous_theme : ''}\n${b.propositions || ''}`,
      ]);

      // Simplifier : une ligne par entrée
      const rows = section.bilan.map((b) => [
        (b.points_positifs || '-').trim(),
        (b.points_negatifs || '-').trim(),
        (b.propositions || '-').trim(),
      ]);

      autoTable(doc, {
        startY: 36,
        head: [[
          { content: 'POINTS POSITIFS', styles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
          { content: "CE QUI N'A PAS MARCHÉ", styles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
          { content: 'PROPOSITIONS DE SOLUTION', styles: { fillColor: [33, 150, 243], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
        ]],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, lineWidth: 0.3, lineColor: [200, 200, 200], overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: (pageWidth - 20) / 3 },
          1: { cellWidth: (pageWidth - 20) / 3 },
          2: { cellWidth: (pageWidth - 20) / 3 },
        },
        margin: { left: 10, right: 10 },
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Aucune entrée pour cette sous-section', pageWidth / 2, 50, { align: 'center' });
    }

    // ===== PAGE PLAN D'ACTION =====
    if (section.plan_action.length > 0) {
      doc.addPage();

      // Header
      doc.setFillColor(26, 54, 93);
      doc.rect(0, 0, pageWidth, 18, 'F');
      doc.setFillColor(212, 175, 55);
      doc.rect(0, 18, pageWidth, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`PLAN D'ACTION ${trimestreSuivant(report.trimestre, report.annee)}`, pageWidth / 2, 9, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Sous-Section ${section.nom}`, pageWidth / 2, 15, { align: 'center' });

      const planRows: string[][] = [];
      section.plan_action.forEach((p, i) => {
        planRows.push([`${i + 1}. ${p.defi}`, `A. ${p.action_a || ''}`]);
        if (p.action_b) planRows.push(['', `B. ${p.action_b}`]);
        if (p.action_c) planRows.push(['', `C. ${p.action_c}`]);
        if (p.action_d) planRows.push(['', `D. ${p.action_d}`]);
      });

      autoTable(doc, {
        startY: 26,
        head: [[
          { content: 'DÉFINISSEZ (3) DÉFIS MAJEURS A RÉALISER\nPOUR VOTRE SECTION POUR LE TRIMESTRE', styles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
          { content: "COMMENT COMPTEZ-VOUS Y PARVENIR\n(Élaborer un plan d'action)", styles: { fillColor: [139, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
        ]],
        body: planRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, lineWidth: 0.3, lineColor: [200, 200, 200], overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: (pageWidth - 20) * 0.45, fontStyle: 'bold' },
          1: { cellWidth: (pageWidth - 20) * 0.55 },
        },
        margin: { left: 10, right: 10 },
      });
    }
  }

  // Numéros de page (sauf page de garde)
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`${i - 1}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  if (mode === 'view') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    doc.save(`${report.titre.replace(/\s+/g, '_')}.pdf`);
  }
}
