import React from 'react';

function formatTrailLine(record) {
  return [record.sourceLabel, record.person || 'Unknown person', record.place || 'Unknown place']
    .filter(Boolean)
    .join(' | ');
}

export default function PodoTrail({ records }) {
  if (!records || records.length === 0) {
    return null;
  }

  return (
    <section className="detail-section-block podo-trail-panel">
      <div className="detail-section-heading">
        <h3>Podo Trail</h3>
        <span>Last seen chain</span>
      </div>

      <ol className="trail-list">
        {records.map((record) => (
          <li key={record.id} className="trail-item">
            <div className="trail-time">
              <strong>{record.createdAt || 'Unknown time'}</strong>
              <span>{record.sourceLabel}</span>
            </div>
            <div className="trail-body">
              <strong>{formatTrailLine(record)}</strong>
              <p>{record.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
