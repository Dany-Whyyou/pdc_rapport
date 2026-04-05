import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  ImageRun,
  Packer,
  PageBreak,
  VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';

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
  const moisLabels: Record<number, string> = {
    1: 'Janvier-Février-Mars',
    2: 'Avril-Mai-Juin',
    3: 'Juillet-Août-Septembre',
    4: 'Octobre-Novembre-Décembre',
  };
  return `${moisLabels[next]} ${nextAnnee}`;
}

async function loadLogoAsArrayBuffer(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch('/logo-pdc.png');
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

function textCell(text: string, options: { bold?: boolean; color?: string; fill?: string; size?: number; alignment?: typeof AlignmentType[keyof typeof AlignmentType] } = {}): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || '',
            bold: options.bold,
            color: options.color || '000000',
            size: (options.size || 9) * 2,
            font: 'Calibri',
          }),
        ],
        alignment: options.alignment || AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
      }),
    ],
    shading: options.fill ? { type: ShadingType.SOLID, fill: options.fill, color: options.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
  });
}

function createBilanTable(section: Section): Table {
  const headerRow = new TableRow({
    children: [
      textCell('POINTS POSITIFS', { bold: true, color: 'FFFFFF', fill: '4CAF50', size: 10, alignment: AlignmentType.CENTER }),
      textCell("CE QUI N'A PAS MARCHÉ", { bold: true, color: 'FFFFFF', fill: 'D32F2F', size: 10, alignment: AlignmentType.CENTER }),
      textCell('PROPOSITIONS DE SOLUTION', { bold: true, color: 'FFFFFF', fill: '2196F3', size: 10, alignment: AlignmentType.CENTER }),
    ],
  });

  const rows = section.bilan.map((b) =>
    new TableRow({
      children: [
        textCell(b.points_positifs || '-'),
        textCell(b.points_negatifs || '-'),
        textCell(b.propositions || '-'),
      ],
    })
  );

  if (rows.length === 0) {
    rows.push(
      new TableRow({
        children: [
          textCell('Aucune entrée', { color: '999999' }),
          textCell('', {}),
          textCell('', {}),
        ],
      })
    );
  }

  return new Table({
    rows: [headerRow, ...rows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  });
}

function createPlanTable(section: Section, trimestre: number, annee: number): Table {
  const headerRow = new TableRow({
    children: [
      textCell('DÉFINISSEZ (3) DÉFIS MAJEURS A RÉALISER\nPOUR VOTRE SECTION POUR LE TRIMESTRE', { bold: true, color: 'FFFFFF', fill: '1A365D', size: 9, alignment: AlignmentType.CENTER }),
      textCell("COMMENT COMPTEZ-VOUS Y PARVENIR\n(Élaborer un plan d'action)", { bold: true, color: 'FFFFFF', fill: '8B0000', size: 9, alignment: AlignmentType.CENTER }),
    ],
  });

  const rows: TableRow[] = [];
  section.plan_action.forEach((p, i) => {
    rows.push(new TableRow({
      children: [
        textCell(`${i + 1}. ${p.defi}`, { bold: true }),
        textCell(`A. ${p.action_a || ''}`),
      ],
    }));
    if (p.action_b) rows.push(new TableRow({ children: [textCell(''), textCell(`B. ${p.action_b}`)] }));
    if (p.action_c) rows.push(new TableRow({ children: [textCell(''), textCell(`C. ${p.action_c}`)] }));
    if (p.action_d) rows.push(new TableRow({ children: [textCell(''), textCell(`D. ${p.action_d}`)] }));
  });

  if (rows.length === 0) {
    rows.push(new TableRow({ children: [textCell('Aucun défi défini', { color: '999999' }), textCell('')] }));
  }

  // Titre du plan en tant que ligne fusionnée n'est pas trivial, on l'ajoute avant
  void trimestre;
  void annee;

  return new Table({
    rows: [headerRow, ...rows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  });
}

export async function generateWord(report: ReportData) {
  const logoBuffer = await loadLogoAsArrayBuffer();

  // Page de garde
  const coverChildren: Paragraph[] = [];

  coverChildren.push(new Paragraph({ spacing: { before: 800 }, children: [] }));

  if (logoBuffer) {
    coverChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 150, height: 150 },
            type: 'png',
          }),
        ],
      })
    );
  }

  coverChildren.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  coverChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'PORTE DES CIEUX', bold: true, size: 56, color: '1A365D', font: 'Calibri' })],
    })
  );

  coverChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 },
      children: [new TextRun({ text: 'Ministère de Louange', size: 28, color: '666666', font: 'Calibri' })],
    })
  );

  coverChildren.push(new Paragraph({ spacing: { before: 600 }, children: [] }));

  coverChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `BILAN PDC ${report.trimestre}e TRIMESTRE`, bold: true, size: 44, color: '1A365D', font: 'Calibri' })],
    })
  );

  coverChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: `(${trimestreLabel(report.trimestre)}) ${report.annee}`, size: 32, color: '555555', font: 'Calibri' })],
    })
  );

  coverChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: 'Sous-Sections Confondues', size: 26, color: '888888', font: 'Calibri' })],
    })
  );

  coverChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200 },
      children: [new TextRun({ text: 'Document confidentiel - Usage interne uniquement', size: 18, color: 'AAAAAA', font: 'Calibri', italics: true })],
    })
  );

  // Page de garde + break
  coverChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // Sections de contenu
  const contentChildren: Paragraph[] = [];

  report.sous_sections.forEach((section, index) => {
    if (index > 0) {
      contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // Titre bilan
    contentChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: `BILAN PDC ${report.trimestre}e TRIMESTRE (${trimestreLabel(report.trimestre)}) ${report.annee}`, bold: true, size: 24, color: '1A365D', font: 'Calibri' })],
      })
    );

    contentChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: `Sous-Section ${section.nom}`, bold: true, size: 28, color: '333333', font: 'Calibri' })],
      })
    );

    // Tableau bilan
    contentChildren.push(new Paragraph({ children: [] }));
    contentChildren.push(createBilanTable(section) as unknown as Paragraph);
    contentChildren.push(new Paragraph({ spacing: { before: 400 }, children: [] }));

    // Plan d'action
    if (section.plan_action.length > 0) {
      contentChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 },
          children: [new TextRun({ text: `PLAN D'ACTION ${trimestreSuivant(report.trimestre, report.annee)}`, bold: true, size: 24, color: '1A365D', font: 'Calibri' })],
        })
      );

      contentChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: `Sous-Section ${section.nom}`, bold: true, size: 22, color: '333333', font: 'Calibri' })],
        })
      );

      contentChildren.push(createPlanTable(section, report.trimestre, report.annee) as unknown as Paragraph);
    }
  });

  const doc = new Document({
    sections: [
      {
        children: [...coverChildren, ...contentChildren],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${report.titre.replace(/\s+/g, '_')}.docx`);
}
