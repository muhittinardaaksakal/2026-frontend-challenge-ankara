import React from 'react';
import LinkedRecordGroup from './LinkedRecordGroup';

function renderFieldValue(value) {
  return value || 'Not provided';
}

export default function DetailPanel({ record, linkedRecords, latestSighting }) {
  const linkedGroups = [
    { key: 'checkins', label: 'Checkins' },
    { key: 'messages', label: 'Messages' },
    { key: 'sightings', label: 'Sightings' },
    { key: 'notes', label: 'Notes' },
    { key: 'tips', label: 'Tips' },
  ];

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="detail-label">Selected Lead</p>
          <h2>{record.person || record.place || record.sourceLabel}</h2>
        </div>
        <span className={`source-badge source-${record.source}`}>{record.sourceLabel}</span>
      </div>

      <div className="detail-meta">
        <div>
          <span className="meta-label">Submission ID</span>
          <strong>{record.submissionId || record.id}</strong>
        </div>
        <div>
          <span className="meta-label">Recorded At</span>
          <strong>{record.createdAt || 'Unknown time'}</strong>
        </div>
        <div>
          <span className="meta-label">Primary Person</span>
          <strong>{record.person || 'Not confidently detected'}</strong>
        </div>
        <div>
          <span className="meta-label">Primary Place</span>
          <strong>{record.place || 'Not confidently detected'}</strong>
        </div>
      </div>

      <div className="detail-section-block">
        <div className="detail-section-heading">
          <h3>Investigation Read</h3>
          <span>Suspicion {record.suspicionScore}</span>
        </div>
        <p>{record.summary}</p>
        {record.content ? <p className="detail-content">{record.content}</p> : null}
      </div>

      <div className="detail-grid">
        <div className="detail-section-block">
          <h3>Related People</h3>
          {record.relatedPeople.length > 0 ? (
            <ul className="detail-list">
              {record.relatedPeople.map((person) => (
                <li key={person}>
                  <strong>{person}</strong>
                  <span>Mentioned in this submission</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">No reliable person names were extracted from this record.</p>
          )}
        </div>

        <div className="detail-section-block">
          <h3>Related Places</h3>
          {record.relatedPlaces.length > 0 ? (
            <ul className="detail-list">
              {record.relatedPlaces.map((place) => (
                <li key={place}>
                  <strong>{place}</strong>
                  <span>Mentioned in this submission</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">No reliable places were extracted from this record.</p>
          )}
        </div>
      </div>

      <div className="detail-section-block">
        <div className="detail-section-heading">
          <h3>Field Inspection</h3>
          <span>{record.fields.length} parsed answers</span>
        </div>
        {record.fields.length > 0 ? (
          <dl className="field-grid">
            {record.fields.map((field) => (
              <div key={`${record.id}-${field.questionId}`} className="field-card">
                <dt>{field.label}</dt>
                <dd>{renderFieldValue(field.value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted-copy">This submission did not expose any readable answer values.</p>
        )}
      </div>

      <div className="detail-section-block">
        <div className="detail-section-heading">
          <h3>Case Context</h3>
          <span>Cross-source view</span>
        </div>
        <p>
          {latestSighting
            ? `Latest sighting in the dataset points to ${latestSighting.place || latestSighting.person || 'an unknown location'} on ${latestSighting.createdAt || 'an unknown date'}.`
            : 'No sighting records have been detected yet.'}
        </p>
      </div>

      <div className="linked-grid">
        {linkedGroups.map((group) => (
          <LinkedRecordGroup
            key={group.key}
            title={group.label}
            records={linkedRecords.grouped[group.key]?.items || []}
          />
        ))}
      </div>
    </div>
  );
}
