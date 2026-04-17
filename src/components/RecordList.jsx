import React from 'react';

function formatStatus(status) {
  if (status === 'in-progress') {
    return 'In Progress';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function RecordList({ records, selectedRecordId, onSelect }) {
  if (records.length === 0) {
    return (
      <div className="list-empty">
        <p>No records match the current filters.</p>
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
              <h2>{record.title}</h2>
              <span className={`status-badge status-${record.status}`}>{formatStatus(record.status)}</span>
            </div>
            <p className="record-id">{record.id}</p>
            <p className="record-description">{record.description}</p>
            <p className="record-date">Created on {record.createdAt}</p>
          </button>
        );
      })}
    </div>
  );
}
