import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <label className="control-group" htmlFor="record-search">
      <span className="control-label">Search</span>
      <input
        id="record-search"
        name="recordSearch"
        className="control-input"
        type="search"
        placeholder="Search people, places, notes, messages, or tips"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
