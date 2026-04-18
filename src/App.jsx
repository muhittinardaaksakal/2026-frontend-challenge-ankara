import React, { useEffect, useMemo, useState } from 'react';
import { getInvestigationSubmissions } from './api/jotform';
import DetailPanel from './components/DetailPanel';
import FilterBar from './components/FilterBar';
import MapPanel from './components/MapPanel';
import PodoTrail from './components/PodoTrail';
import RecordList from './components/RecordList';
import SearchBar from './components/SearchBar';
import StateView from './components/StateView';
import SummaryBar from './components/SummaryBar';
import {
  buildInvestigationModel,
  filterInvestigationRecords,
  getLinkedRecords,
} from './utils/investigation';

const INITIAL_STATE = {
  records: [],
  recordsBySource: {},
  people: [],
  places: [],
  summary: {
    totalRecords: 0,
    totalSources: 0,
    topPerson: '',
    topPlace: '',
    suspiciousLead: null,
    latestSighting: null,
    podoTrail: [],
    lastSeenWithPodo: null,
    highestConfidenceTip: null,
  },
};

export default function App() {
  const [data, setData] = useState(INITIAL_STATE);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');
  const [placeFilter, setPlaceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const response = await getInvestigationSubmissions();
        const investigationModel = buildInvestigationModel(response.sources);

        if (!isMounted) {
          return;
        }

        setData(investigationModel);
        setSelectedRecordId(investigationModel.records[0]?.id ?? '');
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'Something went wrong while loading the investigation sources.');
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
    return filterInvestigationRecords(data.records, {
      query,
      source: sourceFilter,
      person: personFilter,
      place: placeFilter,
    });
  }, [data.records, query, sourceFilter, personFilter, placeFilter]);

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

  const linkedRecords = useMemo(() => {
    return getLinkedRecords(selectedRecord, data.records);
  }, [selectedRecord, data.records]);

  function focusRecord(record, options = {}) {
    if (!record) {
      return;
    }

    setQuery('');
    setSourceFilter(options.source ?? 'all');
    setPersonFilter(options.person ?? 'all');
    setPlaceFilter(options.place ?? 'all');
    setSelectedRecordId(record.id);
  }

  function handleInsightFocus(insightKey) {
    if (insightKey === 'podo' && data.summary.lastSeenWithPodo) {
      const focusRecordItem = data.records.find((record) => record.id === data.summary.lastSeenWithPodo.recordId);

      focusRecord(focusRecordItem, {
        person: data.summary.lastSeenWithPodo.personKey || 'all',
        place: data.summary.lastSeenWithPodo.placeKey || 'all',
      });
      return;
    }

    if (insightKey === 'lead' && data.summary.suspiciousLead) {
      focusRecord(data.summary.suspiciousLead, {
        source: data.summary.suspiciousLead.source,
      });
      return;
    }

    if (insightKey === 'place' && data.summary.topPlace) {
      const topPlaceOption = data.places.find((item) => item.value === data.summary.topPlace);

      setQuery('');
      setSourceFilter('all');
      setPersonFilter('all');
      setPlaceFilter(topPlaceOption?.key || 'all');
      return;
    }

    if (insightKey === 'tip' && data.summary.highestConfidenceTip) {
      focusRecord(data.summary.highestConfidenceTip, {
        source: 'tips',
      });
    }
  }

  function handleTrailSelect(record) {
    focusRecord(record, {
      source: 'all',
      person: record.personKey || 'all',
      place: record.placeKey || 'all',
    });
  }

  function handleMapSelect(record) {
    if (!record) {
      return;
    }

    setSelectedRecordId(record.id);
  }

  const sourceOptions = useMemo(() => {
    const configuredOptions = [
      { value: 'all', label: 'All sources' },
      { value: 'checkins', label: 'Checkins' },
      { value: 'messages', label: 'Messages' },
      { value: 'sightings', label: 'Sightings' },
      { value: 'notes', label: 'Personal Notes' },
      { value: 'tips', label: 'Anonymous Tips' },
    ];

    return configuredOptions.filter((option) => {
      return option.value === 'all' || data.records.some((record) => record.source === option.value);
    });
  }, [data.records]);

  const personOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All people' },
      ...data.people.slice(0, 12).map((item) => ({ value: item.key, label: item.value })),
    ];
  }, [data.people]);

  const placeOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All places' },
      ...data.places.slice(0, 12).map((item) => ({ value: item.key, label: item.value })),
    ];
  }, [data.places]);

  const hasRecords = filteredRecords.length > 0;
  const resultLabel = `${filteredRecords.length} lead${filteredRecords.length === 1 ? '' : 's'}`;

  return (
    <div className="app-shell">
      <header className="page-header">
        <div className="page-header-main">
          <div className="header-tag-row">
            <p className="eyebrow">Jotform Frontend Hackathon</p>
            <span className="product-pill">Missing Podo</span>
          </div>
          <h1>Missing Podo: The Ankara Case</h1>
          <p className="header-subcopy">
            An investigation dashboard that pulls live Jotform submissions, normalizes mixed records,
            and helps trace the last believable sightings chain.
          </p>
        </div>
        <p className="header-copy">
          Explore checkins, messages, sightings, notes, and anonymous tips in one linked workspace.
        </p>
      </header>

      {!loading && !error && data.records.length > 0 ? (
        <SummaryBar summary={data.summary} onFocusInsight={handleInsightFocus} />
      ) : null}

      <main className="app-layout">
        <section className="panel sidebar-panel">
          <div className="sidebar-controls">
            <SearchBar value={query} onChange={setQuery} />
            <FilterBar
              label="Source"
              value={sourceFilter}
              onChange={setSourceFilter}
              options={sourceOptions}
              inputId="source-filter"
              inputName="sourceFilter"
            />
            <FilterBar
              label="Person"
              value={personFilter}
              onChange={setPersonFilter}
              options={personOptions}
              inputId="person-filter"
              inputName="personFilter"
            />
            <FilterBar
              label="Place"
              value={placeFilter}
              onChange={setPlaceFilter}
              options={placeOptions}
              inputId="place-filter"
              inputName="placeFilter"
            />
          </div>

          {!loading && !error ? (
            <div className="results-summary">
              <span className="results-summary-label">Visible leads</span>
              <strong>{resultLabel}</strong>
            </div>
          ) : null}

          <div className="sidebar-list-region">
            {loading ? (
              <StateView
                title="Loading investigation feeds"
                message="Fetching Jotform submissions and preparing the dashboard."
              />
            ) : error ? (
              <StateView
                title="Could not load case data"
                message={error}
                tone="error"
              />
            ) : (
              <div className="record-list-scroll">
                <RecordList
                  records={filteredRecords}
                  selectedRecordId={selectedRecordId}
                  onSelect={setSelectedRecordId}
                />
              </div>
            )}
          </div>
        </section>

        <section className="panel detail-section">
          {loading ? (
            <StateView
              title="Preparing details"
              message="Selected lead details will appear once the case data is ready."
            />
          ) : error ? (
            <StateView
              title="Unable to show details"
              message="The detail panel is unavailable because the investigation sources failed to load."
              tone="error"
              action={
                <p className="muted-copy">
                  Make sure `.env.local` contains a valid `VITE_JOTFORM_API_KEY` and restart the dev
                  server.
                </p>
              }
            />
          ) : hasRecords && selectedRecord ? (
            <>
              <PodoTrail records={data.summary.podoTrail} onSelectRecord={handleTrailSelect} />
              <MapPanel
                records={filteredRecords}
                selectedRecordId={selectedRecordId}
                onSelectRecord={handleMapSelect}
              />
              <DetailPanel
                record={selectedRecord}
                linkedRecords={linkedRecords}
                latestSighting={data.summary.latestSighting}
              />
            </>
          ) : (
            <StateView
              title="No leads found"
              message="Try a different search term or widen the source, person, or place filters."
              tone="empty"
            />
          )}
        </section>
      </main>
    </div>
  );
}
