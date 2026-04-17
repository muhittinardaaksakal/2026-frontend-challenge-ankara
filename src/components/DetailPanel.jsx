import React from 'react';

function formatEventType(type) {
  return type
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatStatus(status) {
  if (status === 'in-progress') {
    return 'In Progress';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function DetailPanel({ record, people, events }) {
  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="detail-label">Selected Record</p>
          <h2>{record.title}</h2>
        </div>
        <span className={`status-badge status-${record.status}`}>{formatStatus(record.status)}</span>
      </div>

      <div className="detail-meta">
        <div>
          <span className="meta-label">Record ID</span>
          <strong>{record.id}</strong>
        </div>
        <div>
          <span className="meta-label">Created At</span>
          <strong>{record.createdAt}</strong>
        </div>
      </div>

      <div className="detail-section-block">
        <h3>Description</h3>
        <p>{record.description}</p>
      </div>

      <div className="detail-grid">
        <div className="detail-section-block">
          <h3>Related People</h3>
          {people.length > 0 ? (
            <ul className="detail-list">
              {people.map((person) => (
                <li key={person.id}>
                  <strong>{person.name}</strong>
                  <span>
                    {person.role} • {person.id}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">No related people found for this record.</p>
          )}
        </div>

        <div className="detail-section-block">
          <h3>Related Events</h3>
          {events.length > 0 ? (
            <ul className="detail-list">
              {events.map((event) => (
                <li key={event.id}>
                  <strong>{formatEventType(event.type)}</strong>
                  <span>
                    {event.date} • {event.id}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">No related events found for this record.</p>
          )}
        </div>
      </div>
    </div>
  );
}
