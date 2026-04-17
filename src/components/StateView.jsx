import React from 'react';

export default function StateView({ title, message, tone = 'default' }) {
  return (
    <div className={`state-view state-${tone}`}>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
