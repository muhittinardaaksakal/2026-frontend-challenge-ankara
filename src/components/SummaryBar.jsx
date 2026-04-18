import React from 'react';

function SummaryCard({
  label,
  value,
  detail,
  accent = 'default',
  actionLabel,
  onClick,
}) {
  const TagName = onClick ? 'button' : 'article';

  return (
    <TagName
      type={onClick ? 'button' : undefined}
      className={`summary-card summary-${accent} ${onClick ? 'summary-card-button' : ''}`}
      onClick={onClick}
    >
      <span className="summary-label">{label}</span>
      <strong>{value || 'Not enough data yet'}</strong>
      {detail ? <p className="summary-detail">{detail}</p> : null}
      {actionLabel ? <span className="summary-action">{actionLabel}</span> : null}
    </TagName>
  );
}

export default function SummaryBar({ summary, onFocusInsight }) {
  const cards = [
    {
      key: 'podo',
      label: 'Last Seen With Podo',
      value: summary.lastSeenWithPodo?.person || 'No confirmed companion yet',
      detail: summary.lastSeenWithPodo
        ? [summary.lastSeenWithPodo.place, summary.lastSeenWithPodo.createdAt].filter(Boolean).join(' | ')
        : 'Latest trail record does not include a second reliable person.',
      accent: 'person',
      actionLabel: summary.lastSeenWithPodo ? 'Focus trail lead' : '',
    },
    {
      key: 'lead',
      label: 'Most Suspicious Lead',
      value: summary.suspiciousLead?.title || 'No suspicious keyword cluster yet',
      detail: summary.suspiciousLead
        ? `${summary.suspiciousLead.sourceLabel} | score ${summary.suspiciousLead.suspicionScore}`
        : 'Keyword scoring has not surfaced a stronger lead yet.',
      accent: 'lead',
      actionLabel: summary.suspiciousLead ? 'Open lead' : '',
    },
    {
      key: 'place',
      label: 'Most Mentioned Place',
      value: summary.topPlace || 'No stable place cluster yet',
      detail: summary.topPlace
        ? 'Most repeated normalized location across linked records.'
        : 'Place extraction has not found a repeated named location.',
      accent: 'place',
      actionLabel: summary.topPlace ? 'Filter by place' : '',
    },
    {
      key: 'tip',
      label: 'Highest Confidence Tip',
      value: summary.highestConfidenceTip?.title || 'No explicit confidence score yet',
      detail: summary.highestConfidenceTip
        ? `${summary.highestConfidenceTip.confidenceLabel} | ${summary.highestConfidenceTip.createdAt || summary.highestConfidenceTip.sourceLabel}`
        : 'Shown only when an anonymous tip includes an explicit confidence or reliability field.',
      accent: 'count',
      actionLabel: summary.highestConfidenceTip ? 'Open tip' : '',
    },
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <SummaryCard
          key={card.key}
          label={card.label}
          value={card.value}
          detail={card.detail}
          accent={card.accent}
          actionLabel={card.actionLabel}
          onClick={card.actionLabel ? () => onFocusInsight?.(card.key) : undefined}
        />
      ))}
    </section>
  );
}
