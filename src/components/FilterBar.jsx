import React from 'react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
];

export default function FilterBar({ value, onChange }) {
  return (
    <label className="control-group">
      <span className="control-label">Status</span>
      <select
        className="control-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
