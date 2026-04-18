import React from 'react';

function formatDate(value) {
  return value || 'Unknown time';
}

export default function LinkedRecordGroup({ title, records }) {
  return (
    <section className="detail-section-block">
      <div className="detail-section-heading">
        <h3>{title}</h3>
        <span>{records.length}</span>
      </div>

      {records.length > 0 ? (
        <ul className="linked-record-list">
          {records.map((record) => (
            <li key={record.id}>
              <strong>{record.summary}</strong>
              <span>
                {record.sourceLabel} • {formatDate(record.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-copy">No linked records from this source for the current selection.</p>
      )}
    </section>
  );
}
