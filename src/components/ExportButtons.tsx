'use client';

interface ExportButtonsProps {
  reportId: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://www.portedescieux.ovh';

export default function ExportButtons({ reportId }: ExportButtonsProps) {
  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('pdc_report_token') || '';
  };

  const viewPdf = () => {
    const token = getToken();
    window.open(`${API_BASE}/api/report/export/pdf?id=${reportId}&token=${token}`, '_blank');
  };

  const downloadPdf = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/report/export/pdf?id=${reportId}&download=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export PDF:', err);
      alert('Erreur lors du telechargement du PDF');
    }
  };

  const downloadWord = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/report/export/word?id=${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${reportId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export Word:', err);
      alert('Erreur lors du telechargement du document Word');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={viewPdf}
        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Voir PDF
      </button>
      <button
        onClick={downloadPdf}
        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        PDF
      </button>
      <button
        onClick={downloadWord}
        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Word
      </button>
    </div>
  );
}
