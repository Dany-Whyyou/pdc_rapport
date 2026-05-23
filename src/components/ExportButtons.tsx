'use client';

import { useState } from 'react';
import { getReport } from '@/lib/api';

interface ExportButtonsProps {
  reportId: number;
}

export default function ExportButtons({ reportId }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadReportData = async (): Promise<any> => {
    const response = await getReport(reportId);
    const r = response.report;
    return {
      titre: r.titre,
      annee: r.annee,
      trimestre: r.trimestre,
      statut: r.statut,
      sous_sections: (r.sections || []).map((s: Record<string, unknown>) => ({
        nom: s.sous_section_nom || '',
        bilan: (s.bilan_entries as Array<Record<string, unknown>>) || [],
        plan_action: (s.plan_entries as Array<Record<string, unknown>>) || [],
      })),
    };
  };

  const handleViewPdf = async () => {
    setExporting('view-pdf');
    try {
      const data = await loadReportData();
      const { generatePdf } = await import('@/lib/exportPdf');
      await generatePdf(data, 'view');
    } catch (err) {
      console.error('Erreur export PDF:', err);
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadPdf = async () => {
    setExporting('pdf');
    try {
      const data = await loadReportData();
      const { generatePdf } = await import('@/lib/exportPdf');
      await generatePdf(data, 'download');
    } catch (err) {
      console.error('Erreur export PDF:', err);
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadWord = async () => {
    setExporting('word');
    try {
      const data = await loadReportData();
      const { generateWord } = await import('@/lib/exportWord');
      await generateWord(data);
    } catch (err) {
      console.error('Erreur export Word:', err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleViewPdf}
        disabled={!!exporting}
        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {exporting === 'view-pdf' ? (
          <div className="w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
        Voir PDF
      </button>
      <button
        onClick={handleDownloadPdf}
        disabled={!!exporting}
        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {exporting === 'pdf' ? (
          <div className="w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        PDF
      </button>
      <button
        onClick={handleDownloadWord}
        disabled={!!exporting}
        className="inline-flex items-center gap-2 px-3 py-2 bg-pdc-cream-dark text-pdc-primary-dark text-sm font-medium rounded-lg hover:bg-pdc-cream-dark transition-colors disabled:opacity-50"
      >
        {exporting === 'word' ? (
          <div className="w-4 h-4 border-2 border-pdc-primary/50 border-t-pdc-primary rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        Word
      </button>
    </div>
  );
}
