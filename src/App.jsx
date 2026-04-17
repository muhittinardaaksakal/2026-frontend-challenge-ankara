import React, { useEffect, useMemo, useState } from 'react';
import { getRecordExplorerData } from './api/records';
import DetailPanel from './components/DetailPanel';
import FilterBar from './components/FilterBar';
import RecordList from './components/RecordList';
import SearchBar from './components/SearchBar';
import StateView from './components/StateView';
import { filterRecords } from './utils/filters';
import { getRelatedItems } from './utils/relations';

const INITIAL_STATE = {
  records: [],
  people: [],
  events: [],
};

export default function App() {
  const [data, setData] = useState(INITIAL_STATE);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const response = await getRecordExplorerData();

        if (!isMounted) {
          return;
        }

        setData(response);
        setSelectedRecordId(response.records[0]?.id ?? '');
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Something went wrong while loading records.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return filterRecords(data.records, searchTerm, statusFilter);
  }, [data.records, searchTerm, statusFilter]);

  useEffect(() => {
    if (filteredRecords.length === 0) {
      setSelectedRecordId('');
      return;
    }

    const selectedStillVisible = filteredRecords.some((record) => record.id === selectedRecordId);

    if (!selectedStillVisible) {
      setSelectedRecordId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedRecordId]);

  const selectedRecord = useMemo(() => {
    return filteredRecords.find((record) => record.id === selectedRecordId) ?? null;
  }, [filteredRecords, selectedRecordId]);

  const relatedData = useMemo(() => {
    return getRelatedItems(selectedRecord, data.people, data.events);
  }, [selectedRecord, data.people, data.events]);

  const hasRecords = filteredRecords.length > 0;
  const resultLabel = `${filteredRecords.length} record${filteredRecords.length === 1 ? '' : 's'}`;

  return (
    <div className="app-shell">
      <header className="page-header">
        <div className="page-header-main">
          <div className="header-tag-row">
            <p className="eyebrow">Frontend Practice Project</p>
            <span className="product-pill">Hackathon Demo</span>
          </div>
          <h1>Record Explorer</h1>
          <p className="header-subcopy">
            A compact internal-style workspace for browsing support records and their linked context.
          </p>
        </div>
        <p className="header-copy">
          Browse support records, inspect details, and explore linked people and events.
        </p>
      </header>

      <main className="app-layout">
        <section className="panel sidebar-panel">
          <div className="sidebar-controls">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            <FilterBar value={statusFilter} onChange={setStatusFilter} />
          </div>
          {!loading && !error ? (
            <div className="results-summary">
              <span className="results-summary-label">Results</span>
              <strong>{resultLabel}</strong>
            </div>
          ) : null}

          {loading ? (
            <StateView
              title="Loading records"
              message="Fetching local mock data and preparing the explorer."
            />
          ) : error ? (
            <StateView
              title="Could not load records"
              message={error}
              tone="error"
            />
          ) : (
            <RecordList
              records={filteredRecords}
              selectedRecordId={selectedRecordId}
              onSelect={setSelectedRecordId}
            />
          )}
        </section>

        <section className="panel detail-section">
          {loading ? (
            <StateView
              title="Preparing details"
              message="Record details will appear once the data is ready."
            />
          ) : error ? (
            <StateView
              title="Unable to show details"
              message="The detail panel is unavailable because the record request failed."
              tone="error"
            />
          ) : hasRecords && selectedRecord ? (
            <DetailPanel
              record={selectedRecord}
              people={relatedData.people}
              events={relatedData.events}
            />
          ) : (
            <StateView
              title="No records found"
              message="Try a different search term or change the status filter."
              tone="empty"
            />
          )}
        </section>
      </main>
    </div>
  );
}
