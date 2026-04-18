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

function getRecordPersonEntries(record) {
  const entries = [];

  if (record.personKey && record.person) {
    entries.push({
      key: record.personKey,
      value: record.person,
    });
  }

  record.relatedPersonKeys.forEach((key, index) => {
    const value = record.relatedPeople[index];

    if (!key || !value) {
      return;
    }

    entries.push({ key, value });
  });

  return uniqueStrings(entries.map((entry) => `${entry.key}:::${entry.value}`)).map((entry) => {
    const [key, value] = entry.split(':::');
    return { key, value };
  });
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

function pickLastSeenWithPodo(trailRecords) {
  const latestRecord = [...trailRecords].reverse().find((record) => {
    return getRecordPersonEntries(record).some((entry) => entry.key !== 'podo');
  });

  if (!latestRecord) {
    return null;
  }

  const companion = getRecordPersonEntries(latestRecord).find((entry) => entry.key !== 'podo');

  if (!companion) {
    return null;
  }

  return {
    personKey: companion.key,
    person: companion.value,
    placeKey: latestRecord.placeKey,
    place: latestRecord.place,
    recordId: latestRecord.id,
    source: latestRecord.source,
    createdAt: latestRecord.createdAt,
    summary: latestRecord.summary,
  };
}

function parseConfidenceValue(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.includes('high')) {
    return { score: 3, label: 'High confidence' };
  }

  if (normalizedValue.includes('medium')) {
    return { score: 2, label: 'Medium confidence' };
  }

  if (normalizedValue.includes('low')) {
    return { score: 1, label: 'Low confidence' };
  }

  const percentMatch = normalizedValue.match(/(\d{1,3})\s*%/);

  if (percentMatch) {
    const percentage = Number(percentMatch[1]);

    if (Number.isFinite(percentage)) {
      return {
        score: percentage,
        label: `${percentage}% confidence`,
      };
    }
  }

  const numberMatch = normalizedValue.match(/\b([1-9]|10)\b/);

  if (numberMatch) {
    const number = Number(numberMatch[1]);

    return {
      score: number,
      label: `${number}/10 confidence`,
    };
  }

  return null;
}

function pickHighestConfidenceTip(records) {
  const tipRecords = records.filter((record) => record.source === 'tips');

  const scoredTips = tipRecords
    .map((record) => {
      const confidenceField = record.fields.find((field) => {
        const label = field.label.toLowerCase();
        const name = field.name.toLowerCase();

        return (
          label.includes('confidence') ||
          label.includes('reliability') ||
          name.includes('confidence') ||
          name.includes('reliability')
        );
      });

      const confidence = parseConfidenceValue(confidenceField?.value);

      if (!confidence) {
        return null;
      }

      return {
        ...record,
        confidenceLabel: confidence.label,
        confidenceScore: confidence.score,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      return right.confidenceScore - left.confidenceScore || right.sortAt - left.sortAt;
    });

  return scoredTips[0] || null;
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
  const podoTrail = buildPodoTrail(records);
  const lastSeenWithPodo = pickLastSeenWithPodo(podoTrail);
  const highestConfidenceTip = pickHighestConfidenceTip(records);

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
      podoTrail,
      lastSeenWithPodo,
      highestConfidenceTip,
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
    const matchesPerson =
      filters.person === 'all' ||
      record.personKey === filters.person ||
      record.relatedPersonKeys.includes(filters.person);
    const matchesPlace =
      filters.place === 'all' ||
      record.placeKey === filters.place ||
      record.relatedPlaceKeys.includes(filters.place);

    return matchesQuery && matchesSource && matchesPerson && matchesPlace;
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
