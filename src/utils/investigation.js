import { normalizeInvestigationSources } from './normalize';

function titleCaseSource(source) {
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildEntityCounts(records, selector) {
  const counts = new Map();

  records.forEach((record) => {
    selector(record).forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function getTopEntity(entities) {
  return entities[0]?.value || '';
}

export function buildInvestigationModel(sourceResponses) {
  const records = normalizeInvestigationSources(sourceResponses);
  const people = buildEntityCounts(records, (record) => uniqueStrings([record.person, ...record.relatedPeople]));
  const places = buildEntityCounts(records, (record) => uniqueStrings([record.place, ...record.relatedPlaces]));
  const recordsBySource = records.reduce((accumulator, record) => {
    accumulator[record.source] = accumulator[record.source] || [];
    accumulator[record.source].push(record);
    return accumulator;
  }, {});

  const suspiciousLead = [...records].sort((left, right) => right.suspicionScore - left.suspicionScore)[0] || null;
  const latestSighting = records.find((record) => record.source === 'sightings') || null;

  return {
    records,
    recordsBySource,
    people,
    places,
    summary: {
      totalRecords: records.length,
      totalSources: Object.keys(recordsBySource).length,
      topPerson: getTopEntity(people),
      topPlace: getTopEntity(places),
      suspiciousLead,
      latestSighting,
    },
  };
}

export function filterInvestigationRecords(records, filters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return records.filter((record) => {
    const matchesQuery =
      normalizedQuery === '' ||
      record.searchText.includes(normalizedQuery) ||
      record.id.toLowerCase().includes(normalizedQuery) ||
      record.summary.toLowerCase().includes(normalizedQuery);
    const matchesSource = filters.source === 'all' || record.source === filters.source;
    const matchesFocus =
      filters.focus === 'all' ||
      record.person === filters.focus ||
      record.place === filters.focus ||
      record.relatedPeople.includes(filters.focus) ||
      record.relatedPlaces.includes(filters.focus);

    return matchesQuery && matchesSource && matchesFocus;
  });
}

export function getLinkedRecords(selectedRecord, records) {
  if (!selectedRecord) {
    return {
      relatedRecords: [],
      grouped: {},
    };
  }

  const linkedPeople = new Set([selectedRecord.person, ...selectedRecord.relatedPeople].filter(Boolean));
  const linkedPlaces = new Set([selectedRecord.place, ...selectedRecord.relatedPlaces].filter(Boolean));

  const relatedRecords = records.filter((record) => {
    if (record.id === selectedRecord.id) {
      return false;
    }

    const sharesPerson =
      [record.person, ...record.relatedPeople].some((value) => linkedPeople.has(value));
    const sharesPlace =
      [record.place, ...record.relatedPlaces].some((value) => linkedPlaces.has(value));

    return sharesPerson || sharesPlace;
  });

  const grouped = relatedRecords.reduce((accumulator, record) => {
    const groupKey = record.source;
    accumulator[groupKey] = accumulator[groupKey] || {
      label: titleCaseSource(record.source),
      items: [],
    };
    accumulator[groupKey].items.push(record);
    return accumulator;
  }, {});

  return {
    relatedRecords,
    grouped,
  };
}
