import React from 'react';

export default function FilterBar({ label, value, onChange, options, inputId, inputName }) {
  return (
    <label className="control-group" htmlFor={inputId}>
      <span className="control-label">{label}</span>
      <select
        id={inputId}
        name={inputName}
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
