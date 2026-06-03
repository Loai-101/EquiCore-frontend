/**
 * Reusable data grid for dashboards.
 * All class names are prefixed with ec-data-table to avoid collisions with page-level styles.
 */
import { useTranslation } from 'react-i18next';
import '../styles/DataTable.css';

export default function DataTable({ columns, rows, emptyMessage }) {
  const { t } = useTranslation();
  const message = emptyMessage ?? t('common.emptyDefault');

  if (!rows?.length) {
    return (
      <div className="ec-data-table">
        <div className="ec-data-table__surface">
          <p className="ec-data-table__empty">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ec-data-table">
      <div className="ec-data-table__surface">
        <table className="ec-data-table__table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
