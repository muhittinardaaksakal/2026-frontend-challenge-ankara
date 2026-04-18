import React from 'react';

export default function RecordList({ records, selectedRecordId, onSelect }) {
  if (records.length === 0) {
    return (
      <div className="list-empty">
        <p>No investigation records match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="record-list">
      {records.map((record) => {
        const isSelected = record.id === selectedRecordId;

        return (
          <button
            key={record.id}
            type="button"
            className={`record-list-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(record.id)}
          >
            <div className="record-list-item-top">
              <h2>{record.person || record.place || record.sourceLabel}</h2>
              <span className={`source-badge source-${record.source}`}>{record.sourceLabel}</span>
            </div>
            <p className="record-id">{record.submissionId || record.id}</p>
            <p className="record-description">{record.summary}</p>
            <div className="record-tag-row">
              {record.person ? <span className="mini-tag">{record.person}</span> : null}
              {record.place ? <span className="mini-tag">{record.place}</span> : null}
              {record.suspicionScore > 0 ? (
                <span className="mini-tag mini-tag-alert">Suspicion +{record.suspicionScore}</span>
              ) : null}
            </div>
            <p className="record-date">{record.createdAt || 'Unknown timestamp'}</p>
          </button>
        );
      })}
    </div>
  );
}
