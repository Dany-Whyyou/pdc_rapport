'use client';

import { useState } from 'react';

export interface PlanEntry {
  id?: number;
  defi: string;
  action_a: string;
  action_b: string;
  action_c: string;
  action_d: string;
}

interface PlanActionTableProps {
  entries: PlanEntry[];
  onChange: (entries: PlanEntry[]) => void;
  readOnly?: boolean;
}

export default function PlanActionTable({ entries, onChange, readOnly = false }: PlanActionTableProps) {
  const [localEntries, setLocalEntries] = useState<PlanEntry[]>(entries);

  const updateEntry = (index: number, field: keyof PlanEntry, value: string) => {
    const updated = [...localEntries];
    updated[index] = { ...updated[index], [field]: value };
    setLocalEntries(updated);
    onChange(updated);
  };

  const addEntry = () => {
    if (localEntries.length >= 3) return;
    const updated = [
      ...localEntries,
      { defi: '', action_a: '', action_b: '', action_c: '', action_d: '' },
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
          <tr className="bg-green-600 text-white">
            <th className="border border-green-700 px-4 py-3 text-left text-sm font-semibold w-1/3">
              Defi
            </th>
            <th className="border border-green-700 px-4 py-3 text-left text-sm font-semibold" colSpan={readOnly ? 1 : 1}>
              Actions (A, B, C, D)
            </th>
            {!readOnly && (
              <th className="border border-green-700 px-2 py-3 text-center text-sm font-semibold w-12">
                &nbsp;
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {localEntries.map((entry, index) => (
            <tr key={entry.id ?? `new-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="border border-gray-200 p-2 align-top">
                {readOnly ? (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap px-2 font-medium">
                    Defi {index + 1}: {entry.defi}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Defi {index + 1}</label>
                    <textarea
                      value={entry.defi}
                      onChange={(e) => updateEntry(index, 'defi', e.target.value)}
                      className="w-full min-h-[80px] p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
                      placeholder={`Defi ${index + 1}...`}
                    />
                  </div>
                )}
              </td>
              <td className="border border-gray-200 p-2 align-top">
                {readOnly ? (
                  <div className="space-y-2 px-2">
                    <div className="text-sm"><span className="font-medium text-green-700">A:</span> <span className="text-gray-900">{entry.action_a}</span></div>
                    <div className="text-sm"><span className="font-medium text-green-700">B:</span> <span className="text-gray-900">{entry.action_b}</span></div>
                    <div className="text-sm"><span className="font-medium text-green-700">C:</span> <span className="text-gray-900">{entry.action_c}</span></div>
                    <div className="text-sm"><span className="font-medium text-green-700">D:</span> <span className="text-gray-900">{entry.action_d}</span></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(['action_a', 'action_b', 'action_c', 'action_d'] as const).map((key, ai) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">
                          Action {String.fromCharCode(65 + ai)}
                        </label>
                        <textarea
                          value={entry[key]}
                          onChange={(e) => updateEntry(index, key, e.target.value)}
                          className="w-full min-h-[50px] p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
                          placeholder={`Action ${String.fromCharCode(65 + ai)}...`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </td>
              {!readOnly && (
                <td className="border border-gray-200 p-2 text-center align-top">
                  <button
                    onClick={() => removeEntry(index)}
                    className="text-red-500 hover:text-red-700 p-1 mt-6"
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
              <td colSpan={readOnly ? 2 : 3} className="text-center py-8 text-gray-500 text-sm">
                Aucun defi defini. {!readOnly && 'Cliquez sur "Ajouter un defi" pour commencer.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!readOnly && localEntries.length < 3 && (
        <button
          onClick={addEntry}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un defi ({localEntries.length}/3)
        </button>
      )}
    </div>
  );
}
