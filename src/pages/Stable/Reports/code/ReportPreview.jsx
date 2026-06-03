/**
 * On-screen report preview — print + html2canvas PDF source.
 */
export default function ReportPreview({ payload, labels }) {
  if (!payload) return null;
  const isRtl = payload.language === 'ar';

  return (
    <div
      className={`rep-preview${isRtl ? ' rep-preview--rtl' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      id="equicore-report-preview"
    >
      <header className="rep-preview__header">
        <div className="rep-preview__brand">
          <span className="rep-preview__logo">EquiCore</span>
          <span className="rep-preview__tagline">{labels.premiumReports}</span>
        </div>
        <div className="rep-preview__meta">
          <p><strong>{labels.stable}:</strong> {payload.stableName}</p>
          <p><strong>{labels.generatedBy}:</strong> {payload.generatedBy}</p>
          <p><strong>{labels.generatedAt}:</strong> {payload.generatedAt}</p>
          <p><strong>{labels.dateRange}:</strong> {payload.dateRange}</p>
        </div>
      </header>

      <h1 className="rep-preview__title">{payload.reportTitle}</h1>

      {payload.filtersUsed?.length > 0 ? (
        <section className="rep-preview__section">
          <h2>{labels.filtersUsed}</h2>
          <ul className="rep-preview__filters">
            {payload.filtersUsed.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {payload.summary?.length > 0 ? (
        <section className="rep-preview__section">
          <h2>{labels.summary}</h2>
          <dl className="rep-preview__summary">
            {payload.summary.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {payload.tableColumns?.length > 0 && payload.tableRows?.length > 0 ? (
        <section className="rep-preview__section">
          <h2>{labels.data}</h2>
          <div className="rep-preview__table-wrap">
            <table className="rep-preview__table">
              <thead>
                <tr>
                  {payload.tableColumns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.tableRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {payload.notes ? (
        <section className="rep-preview__section">
          <h2>{labels.notes}</h2>
          <p className="rep-preview__notes">{payload.notes}</p>
        </section>
      ) : null}

      <footer className="rep-preview__signature">
        <div className="rep-preview__sign-line" />
        <p>{labels.signature}</p>
        <p className="rep-preview__footer-note">{labels.footer}</p>
      </footer>
    </div>
  );
}
