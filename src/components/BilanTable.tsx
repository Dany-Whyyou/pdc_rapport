'use client';

import { useState } from 'react';

export interface BilanEntry {
  id?: number;
  theme: string;
  sous_theme?: string;
  points_positifs: string;
  points_negatifs: string;
  propositions: string;
  ordre?: number;
}

interface BilanTableProps {
  entries: BilanEntry[];
  onChange: (entries: BilanEntry[]) => void;
  readOnly?: boolean;
}

export default function BilanTable({ entries, onChange, readOnly = false }: BilanTableProps) {
  const [localEntries, setLocalEntries] = useState<BilanEntry[]>(entries);

  const updateEntry = (index: number, field: keyof BilanEntry, value: string) => {
    const updated = [...localEntries];
    updated[index] = { ...updated[index], [field]: value };
    setLocalEntries(updated);
    onChange(updated);
  };

  const addEntry = () => {
    const updated = [
      ...localEntries,
      { theme: '', points_positifs: '', points_negatifs: '', propositions: '' },
    ];
    setLocalEntries(updated);
    onChange(updated);
  };

  const removeEntry = (index: number) => {
    const updated = localEntries.filter((_, i) => i !== index);
    setLocalEntries(updated);
    onChange(updated);
  };

  // Sync external entries changes
  if (entries.length !== localEntries.length || entries.some((e, i) => e.id !== localEntries[i]?.id)) {
    setLocalEntries(entries);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="border border-blue-700 px-4 py-3 text-left text-sm font-semibold w-1/6">
              Theme
            </th>
            <th className="border border-blue-700 px-4 py-3 text-left text-sm font-semibold w-[27%]">
              Points positifs
            </th>
            <th className="border border-blue-700 px-4 py-3 text-left text-sm font-semibold w-[27%]">
              Ce qui n&apos;a pas marche
            </th>
            <th className="border border-blue-700 px-4 py-3 text-left text-sm font-semibold w-[27%]">
              Propositions
            </th>
            {!readOnly && (
              <th className="border border-blue-700 px-2 py-3 text-center text-sm font-semibold w-12">
                &nbsp;
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {localEntries.map((entry, index) => (
            <tr key={entry.id ?? `new-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="border border-gray-200 p-2">
                {readOnly ? (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap px-2">{entry.theme}</div>
                ) : (
                  <textarea
                    value={entry.theme}
                    onChange={(e) => updateEntry(index, 'theme', e.target.value)}
                    className="w-full min-h-[80px] p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    placeholder="Theme..."
                  />
                )}
              </td>
              <td className="border border-gray-200 p-2">
                {readOnly ? (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap px-2">{entry.points_positifs}</div>
                ) : (
                  <textarea
                    value={entry.points_positifs}
                    onChange={(e) => updateEntry(index, 'points_positifs', e.target.value)}
                    className="w-full min-h-[80px] p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    placeholder="Points positifs..."
                  />
                )}
              </td>
              <td className="border border-gray-200 p-2">
                {readOnly ? (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap px-2">{entry.points_negatifs}</div>
                ) : (
                  <textarea
                    value={entry.points_negatifs}
                    onChange={(e) => updateEntry(index, 'points_negatifs', e.target.value)}
                    className="w-full min-h-[80px] p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    placeholder="Ce qui n'a pas marche..."
                  />
                )}
              </td>
              <td className="border border-gray-200 p-2">
                {readOnly ? (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap px-2">{entry.propositions}</div>
                ) : (
                  <textarea
                    value={entry.propositions}
                    onChange={(e) => updateEntry(index, 'propositions', e.target.value)}
                    className="w-full min-h-[80px] p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    placeholder="Propositions..."
                  />
                )}
              </td>
              {!readOnly && (
                <td className="border border-gray-200 p-2 text-center">
                  <button
                    onClick={() => removeEntry(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}
          {localEntries.length === 0 && (
            <tr>
              <td colSpan={readOnly ? 4 : 5} className="text-center py-8 text-gray-500 text-sm">
                Aucun element dans le bilan. {!readOnly && 'Cliquez sur "Ajouter un theme" pour commencer.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!readOnly && (
        <button
          onClick={addEntry}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un theme
        </button>
      )}
    </div>
  );
}
