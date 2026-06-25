'use client';

import { useEffect, useState } from 'react';
import { Mail, ArrowRightLeft, AlertCircle, CheckCircle, Check, X } from 'lucide-react';
import { useSendPreview } from '@/hooks/useSendPreview';

interface ColumnMapperProps {
  templateVariables: string[];
  csvColumns: string[];
  sampleRow?: Record<string, any> | null;
  mapping: Record<string, string>;
  onChangeMapping: (mapping: Record<string, string>) => void;
  emailColumn: string;
  onChangeEmailColumn: (col: string) => void;
  subjectTemplate: string;
  bodyTemplate: string;
}

export default function ColumnMapper({
  templateVariables,
  csvColumns,
  sampleRow = null,
  mapping,
  onChangeMapping,
  emailColumn,
  onChangeEmailColumn,
  subjectTemplate,
  bodyTemplate,
}: ColumnMapperProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const [hasAutoMapped, setHasAutoMapped] = useState(false);

  // Auto-map columns only once on initial load or when columns/variables change significantly
  useEffect(() => {
    if (hasAutoMapped || templateVariables.length === 0 || csvColumns.length === 0) return;

    const updated = { ...mapping };
    let changed = false;

    for (const variable of templateVariables) {
      if (!updated[variable]) {
        const vLower = variable.trim().toLowerCase().replace(/_/g, ' ');
        
        // Look for exact match
        let matchedCol = csvColumns.find(
          (col) => col.trim().toLowerCase() === variable.trim().toLowerCase()
        );
        
        // Look for fuzzy match
        if (!matchedCol) {
          matchedCol = csvColumns.find((col) => {
            const cLower = col.trim().toLowerCase().replace(/_/g, ' ');
            if (vLower.length < 3 || cLower.length < 3) return false;
            
            const vWords = vLower.split(' ').filter(Boolean);
            const allWordsMatch = vWords.every(w => cLower.includes(w));
            
            return allWordsMatch || cLower.includes(vLower) || vLower.includes(cLower);
          });
        }

        if (matchedCol) {
          updated[variable] = matchedCol;
          changed = true;
        }
      }
    }

    // Auto-map email column if any CSV column matches "email"
    if (!emailColumn) {
      const emailCol = csvColumns.find(
        (col) => col.trim().toLowerCase().includes('email') || col.trim().toLowerCase() === 'mail'
      );
      if (emailCol) {
        onChangeEmailColumn(emailCol);
      }
    }

    if (changed) {
      onChangeMapping(updated);
    }
    setHasAutoMapped(true);
  }, [templateVariables, csvColumns, emailColumn, mapping, onChangeMapping, onChangeEmailColumn, hasAutoMapped]);

  const [openCombobox, setOpenCombobox] = useState<string | null>(null);

  // Handle click outside to close comboboxes
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.combobox-container')) {
        setOpenCombobox(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (variable: string, value: string) => {
    // If empty, clear the mapping
    if (!value.trim()) {
      const updated = { ...mapping };
      delete updated[variable];
      onChangeMapping(updated);
      return;
    }

    // Check if the typed value perfectly matches a CSV column
    const isColumn = csvColumns.includes(value);
    const mappedValue = isColumn ? value : `STATIC::${value}`;
    
    onChangeMapping({ ...mapping, [variable]: mappedValue });
  };

  // Run live preview substitutions using our custom hook
  const { subjectPreview, bodyPreview, errors: previewErrors } = useSendPreview(
    subjectTemplate,
    bodyTemplate,
    sampleRow,
    mapping
  );

  // Perform validation on mappings
  const allVariablesMapped = templateVariables.every((v) => !!mapping[v]);
  const isEmailMapped = !!emailColumn;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Mapping Configuration Panel */}
      <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-900 dark:bg-gray-950">
        <div>
          <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Column Mapping</h3>
          <p className="text-xs text-gray-500 mt-1">Bind your template variables to spreadsheet header columns.</p>
        </div>

        {/* Email Field Setup */}
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/30">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
            <Mail className="h-4.5 w-4.5 text-indigo-500" />
            <span>Recipient Email Address Column *</span>
          </label>
          <select
            value={emailColumn}
            onChange={(e) => onChangeEmailColumn(e.target.value)}
            className="mt-2.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
          >
            <option value="">-- Choose Column --</option>
            {csvColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Template Variables Mapping */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Template Variables</h4>
          
          {templateVariables.length === 0 ? (
            <p className="text-xs text-gray-450 italic py-2">No variables found in template.</p>
          ) : (
            templateVariables.map((variable) => {
              const mappingValue = mapping[variable] || '';
              const isActuallyStatic = mappingValue.startsWith('STATIC::');
              const displayValue = isActuallyStatic ? mappingValue.replace('STATIC::', '') : mappingValue;
              const isOpen = openCombobox === variable;

              return (
                <div key={variable} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0 dark:border-gray-900">
                  <span className="flex-shrink-0 rounded-xl border border-indigo-100 bg-indigo-50/20 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:border-indigo-950/40 dark:bg-indigo-950/10 dark:text-indigo-400">
                    {"{{"} {variable} {"}}"}
                  </span>
                  
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <ArrowRightLeft className="h-4 w-4 text-gray-300 flex-shrink-0 ml-auto mr-1 hidden sm:block" />

                    <div className="relative w-full flex-1 min-w-0 combobox-container">
                      <div className="relative flex items-center w-full">
                        <input
                          type="text"
                          placeholder="Select or type..."
                          value={displayValue}
                          onChange={(e) => handleInputChange(variable, e.target.value)}
                          onFocus={() => setOpenCombobox(variable)}
                          className="w-full flex-1 rounded-xl border border-gray-200 bg-white pl-3 pr-8 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
                        />
                        <div className="absolute right-8 flex items-center pr-1 h-full">
                          {displayValue && (
                            <button
                              type="button"
                              onClick={() => handleInputChange(variable, '')}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div 
                          className="absolute right-2 cursor-pointer p-1"
                          onClick={() => setOpenCombobox(isOpen ? null : variable)}
                        >
                          <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {isOpen && (
                        <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                          {csvColumns.map((col) => {
                            const isSelected = col === displayValue;
                            return (
                              <div
                                key={col}
                                className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs ${
                                  isSelected 
                                    ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                                    : 'text-gray-700 hover:bg-indigo-50/50 dark:text-gray-200 dark:hover:bg-indigo-900/20'
                                }`}
                                onClick={() => {
                                  handleInputChange(variable, col);
                                  setOpenCombobox(null);
                                }}
                              >
                                <span>{col}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Validation Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {allVariablesMapped ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/20">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>All variables mapped</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full dark:bg-amber-950/20 animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Unmapped variables remaining</span>
            </span>
          )}

          {isEmailMapped ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/20">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Email column mapped</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full dark:bg-rose-950/20">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Email column unmapped</span>
            </span>
          )}
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="space-y-4 rounded-2xl border border-gray-150 bg-gray-50/30 p-6 dark:border-gray-800 dark:bg-gray-900/10">
        <div>
          <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Live Send Preview</h3>
          <p className="text-xs text-gray-500 mt-1">Substitution preview using the first row of CSV records.</p>
        </div>

        {previewErrors.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/10 dark:text-rose-400">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Substitution Warnings:</span>
              <ul className="list-disc list-inside">
                {previewErrors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4 shadow-sm dark:border-gray-900 dark:bg-gray-950">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Subject</span>
            <p className="text-sm font-semibold text-gray-950 dark:text-white mt-1">
              {subjectPreview || <span className="text-gray-400 italic">No subject entered</span>}
            </p>
          </div>
          
          <div className="border-t border-gray-50 pt-4 dark:border-gray-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Body Preview</span>
            {bodyPreview ? (
              <div
                className="mt-2 text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none focus:outline-none"
                dangerouslySetInnerHTML={{ __html: bodyPreview }}
              />
            ) : (
              <p className="text-sm text-gray-400 italic mt-2">No body text entered</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
