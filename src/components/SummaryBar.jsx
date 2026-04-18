import React from 'react';

function SummaryCard({ label, value, accent = 'default' }) {
  return (
    <article className={`summary-card summary-${accent}`}>
      <span className="summary-label">{label}</span>
      <strong>{value || 'Not enough data yet'}</strong>
    </article>
  );
}

export default function SummaryBar({ summary }) {
  return (
    <section className="summary-grid">
      <SummaryCard label="Records Collected" value={summary.totalRecords} accent="count" />
      <SummaryCard label="Most Mentioned Person" value={summary.topPerson} accent="person" />
      <SummaryCard label="Most Mentioned Place" value={summary.topPlace} accent="place" />
      <SummaryCard
        label="Suspicious Lead"
        value={summary.suspiciousLead?.summary || 'No suspicious keyword clusters yet'}
        accent="lead"
      />
    </section>
  );
}
