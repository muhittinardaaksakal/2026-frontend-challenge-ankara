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
      const currentItem = counts.get(value.key);

      if (!currentItem) {
        counts.set(value.key, {
          key: value.key,
          value: value.value,
          count: 1,
        });
        return;
      }

      counts.set(value.key, {
        ...currentItem,
        value: value.value.length > currentItem.value.length ? value.value : currentItem.value,
        count: currentItem.count + 1,
      });
    });
  });

  return [...counts.values()].sort((left, right) => {
    return right.count - left.count || left.value.localeCompare(right.value);
  });
}

function getTopEntity(entities) {
  return entities[0]?.value || '';
}

function includesPodo(record) {
  const haystack = [record.person, record.content, record.summary, ...record.relatedPeople]
    .join(' ')
    .toLowerCase();

  return haystack.includes('podo');
}

function buildPodoTrail(records) {
  return records
    .filter((record) => {
      return includesPodo(record) && ['sightings', 'checkins', 'messages', 'notes', 'tips'].includes(record.source);
    })
    .sort((left, right) => {
      return left.sortAt - right.sortAt;
    })
    .slice(-8);
}

export function buildInvestigationModel(sourceResponses) {
  const records = normalizeInvestigationSources(sourceResponses);
  const people = buildEntityCounts(records, (record) =>
    uniqueStrings([record.personKey, ...record.relatedPersonKeys])
      .filter(Boolean)
      .map((key) => ({
        key,
        value:
          (record.personKey === key && record.person) ||
          record.relatedPeople[record.relatedPersonKeys.indexOf(key)] ||
          key,
      })),
  );
  const places = buildEntityCounts(records, (record) =>
    uniqueStrings([record.placeKey, ...record.relatedPlaceKeys])
      .filter(Boolean)
      .map((key) => ({
        key,
        value:
          (record.placeKey === key && record.place) ||
          record.relatedPlaces[record.relatedPlaceKeys.indexOf(key)] ||
          key,
      })),
  );
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
      podoTrail: buildPodoTrail(records),
    },
  };
}

export function filterInvestigationRecords(records, filters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return records.filter((record) => {
    const matchesQuery =
      normalizedQuery === '' ||
      record.searchText.includes(normalizedQuery) ||
      record.id.toLowerCase().includes(normalizedQuery);
    const matchesSource = filters.source === 'all' || record.source === filters.source;
    const matchesFocus =
      filters.focus === 'all' ||
      record.personKey === filters.focus ||
      record.placeKey === filters.focus ||
      record.relatedPersonKeys.includes(filters.focus) ||
      record.relatedPlaceKeys.includes(filters.focus);

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

  const linkedPeople = new Set([selectedRecord.personKey, ...selectedRecord.relatedPersonKeys].filter(Boolean));
  const linkedPlaces = new Set([selectedRecord.placeKey, ...selectedRecord.relatedPlaceKeys].filter(Boolean));

  const relatedRecords = records.filter((record) => {
    if (record.id === selectedRecord.id) {
      return false;
    }

    const sharesPerson = [record.personKey, ...record.relatedPersonKeys].some((value) => linkedPeople.has(value));
    const sharesPlace = [record.placeKey, ...record.relatedPlaceKeys].some((value) => linkedPlaces.has(value));

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
