import React from 'react';
import { FiPlus } from 'react-icons/fi';

const DEFAULT_TABLE = [
  ['', '', ''],
  ['', '', ''],
  ['', '', ''],
];

const TableBlock = ({ block, onChange, readOnly }) => {
  const rows = Array.isArray(block.content.rows) && block.content.rows.length > 0
    ? block.content.rows
    : DEFAULT_TABLE;

  const updateCell = (rowIdx, colIdx, value) => {
    const nextRows = rows.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? value : cell))
    );
    onChange?.({ rows: nextRows });
  };

  const addRow = () => {
    const colCount = rows[0]?.length || 3;
    onChange?.({ rows: [...rows, Array.from({ length: colCount }, () => '')] });
  };

  const addColumn = () => {
    const nextRows = rows.map((row) => [...row, '']);
    onChange?.({ rows: nextRows });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900/40">
        <table className="w-full border-collapse min-w-[540px]">
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={`r-${rowIdx}`}>
                {row.map((cell, colIdx) => (
                  <td
                    key={`c-${rowIdx}-${colIdx}`}
                    className="border border-slate-200 dark:border-white/10 p-0"
                  >
                    {readOnly ? (
                      <div className="px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 min-h-[42px]">{cell}</div>
                    ) : (
                      <input
                        value={cell}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5"
                        placeholder="Cell value"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            <FiPlus size={12} />
            Row
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            <FiPlus size={12} />
            Column
          </button>
        </div>
      )}
    </div>
  );
};

export default TableBlock;
