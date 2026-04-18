import React from 'react';

export default function FilterBar({ label, value, onChange, options }) {
  return (
    <label className="control-group">
      <span className="control-label">{label}</span>
      <select
        className="control-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
