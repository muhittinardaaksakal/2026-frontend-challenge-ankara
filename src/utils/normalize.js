const PERSON_HINTS = [
  'name',
  'person',
  'contact',
  'visitor',
  'witness',
  'suspect',
  'sender',
  'recipient',
  'owner',
  'driver',
  'reported by',
  'reportedby',
  'seen by',
  'noted by',
  'mentioned people',
  'mentionedpeople',
  'author',
];

const PERSON_FIELD_PRIORITY = [
  'person name',
  'sender name',
  'recipient name',
  'suspect name',
  'seen with',
  'author name',
];

const PLACE_HINTS = [
  'location',
  'place',
  'address',
  'area',
  'venue',
  'street',
  'district',
  'spot',
  'checkpoint',
  'check-in',
  'checkin',
];

const CONTENT_HINTS = [
  'message',
  'note',
  'details',
  'description',
  'summary',
  'tip',
  'content',
  'statement',
  'observation',
];

const SUSPICIOUS_KEYWORDS = [
  'urgent',
  'shadow',
  'followed',
  'lying',
  'fake',
  'unknown',
  'escaped',
  'disappeared',
  'suspicious',
  'panic',
  'threat',
  'midnight',
  'blood',
  'basement',
  'warehouse',
  'tampered',
];

const NAME_STOPWORDS = new Set([
  'surekli',
  'eger',
  'yan',
  'yanindaki',
  'yakininda',
  'buradaki',
  'herkes',
  'kalabalik',
  'burasi',
  'orasi',
  'aslinda',
  'galiba',
  'biraz',
  'sonra',
  'sadece',
  'simdi',
  'orada',
  'burada',
  'mesele',
  'baska',
  'bunun',
  'sunun',
  'oyle',
  'boyle',
  'buradaki',
  'teknik',
  'messages',
  'checkins',
  'sightings',
  'personal',
  'notes',
  'anonymous',
  'tips',
  'submit',
]);

const KNOWN_PLACE_DISPLAY = {
  cermodern: 'CerModern',
};

function transliterateTurkish(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I');
}

function slugify(value) {
  return transliterateTurkish(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseFlexibleDate(value) {
  const input = String(value || '').trim();

  if (!input) {
    return null;
  }

  const dayFirstMatch = input.match(
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );

  if (dayFirstMatch) {
    const [, day, month, year, hour = '0', minute = '0'] = dayFirstMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(input);

  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDate(value) {
  if (!value) {
    return '';
  }

  const date = parseFlexibleDate(value);

  if (!date) {
    return String(value);
  }

  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeAnswerValue(answer) {
  const rawValue = answer?.answer;

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => String(item).trim()).filter(Boolean).join(', ');
  }

  if (typeof rawValue === 'object') {
    const objectValues = Object.values(rawValue)
      .map((item) => String(item).trim())
      .filter(Boolean);

    if (objectValues.length > 0) {
      return objectValues.join(' ');
    }
  }

  return String(rawValue).trim();
}

function createFieldEntry(questionId, answer) {
  const label = answer?.text?.trim() || answer?.name?.trim() || `Field ${questionId}`;
  const name = answer?.name?.trim() || '';
  const value = normalizeAnswerValue(answer);

  return {
    questionId,
    label,
    name,
    value,
    type: answer?.type || '',
  };
}

export function parseSubmissionAnswers(submission) {
  const answers = submission?.answers && typeof submission.answers === 'object' ? submission.answers : {};
  const entries = Object.entries(answers).map(([questionId, answer]) => createFieldEntry(questionId, answer));
  const byLabel = {};
  const byName = {};

  entries.forEach((entry) => {
    if (entry.label) {
      byLabel[slugify(entry.label)] = entry.value;
    }

    if (entry.name) {
      byName[slugify(entry.name)] = entry.value;
    }
  });

  return {
    entries,
    byLabel,
    byName,
  };
}

function findFirstMatch(lookup, hints) {
  const keys = Object.keys(lookup);
  const matchedKey = keys.find((key) => hints.some((hint) => key.includes(hint)));

  return matchedKey ? lookup[matchedKey] : '';
}

function findPriorityMatch(lookup, priorities) {
  const keys = Object.keys(lookup);

  for (const priority of priorities) {
    const matchedKey = keys.find((key) => key.includes(priority));

    if (matchedKey && lookup[matchedKey]) {
      return lookup[matchedKey];
    }
  }

  return '';
}

function collectValuesByHints(entries, hints) {
  return entries
    .filter((entry) => {
      const labelKey = slugify(entry.label);
      const nameKey = slugify(entry.name);

      return hints.some((hint) => labelKey.includes(hint) || nameKey.includes(hint));
    })
    .map((entry) => entry.value)
    .filter(Boolean);
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function chooseBetterDisplayName(currentValue, nextValue) {
  if (!currentValue) {
    return nextValue;
  }

  const currentHasInitial = /\b[A-Z]\.?$/u.test(currentValue);
  const nextHasInitial = /\b[A-Z]\.?$/u.test(nextValue);
  const currentHasTurkish = /[ÇĞİÖŞÜçğıöşü]/u.test(currentValue);
  const nextHasTurkish = /[ÇĞİÖŞÜçğıöşü]/u.test(nextValue);

  if (currentHasInitial !== nextHasInitial) {
    return currentHasInitial ? nextValue : currentValue;
  }

  if (currentHasTurkish !== nextHasTurkish) {
    return nextHasTurkish ? nextValue : currentValue;
  }

  if (nextValue.length !== currentValue.length) {
    return nextValue.length < currentValue.length ? nextValue : currentValue;
  }

  return nextValue.localeCompare(currentValue, 'tr', { sensitivity: 'base' }) < 0 ? nextValue : currentValue;
}

function buildCanonicalPersonDisplayMap(records) {
  const displayByKey = new Map();

  records.forEach((record) => {
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

    entries.forEach((entry) => {
      const currentValue = displayByKey.get(entry.key);
      displayByKey.set(entry.key, chooseBetterDisplayName(currentValue, entry.value));
    });
  });

  return displayByKey;
}

function dedupeCanonicalPeople(relatedPersonKeys, relatedPeople, displayByKey) {
  const seenKeys = new Set();
  const people = [];

  relatedPersonKeys.forEach((key, index) => {
    if (!key || seenKeys.has(key)) {
      return;
    }

    const fallbackValue = relatedPeople[index];
    const displayValue = displayByKey.get(key) || fallbackValue;

    if (!displayValue) {
      return;
    }

    seenKeys.add(key);
    people.push({
      key,
      value: displayValue,
    });
  });

  return people;
}

function applyCanonicalPersonAliases(records) {
  const displayByKey = buildCanonicalPersonDisplayMap(records);

  return records.map((record) => {
    const canonicalPerson = record.personKey ? displayByKey.get(record.personKey) || record.person : record.person;
    const canonicalRelatedPeople = dedupeCanonicalPeople(
      record.relatedPersonKeys,
      record.relatedPeople,
      displayByKey,
    );
    const summary = buildSummary(record.sourceLabel, record.content, canonicalPerson, record.place);
    const title = createLeadTitle(record.sourceLabel, canonicalPerson, record.place);
    const searchText = [
      record.sourceLabel,
      canonicalPerson,
      record.place,
      summary,
      record.personKey,
      record.placeKey,
    ]
      .join(' ')
      .toLowerCase();

    return {
      ...record,
      person: canonicalPerson,
      relatedPeople: canonicalRelatedPeople.map((item) => item.value),
      relatedPersonKeys: canonicalRelatedPeople.map((item) => item.key),
      summary,
      title,
      searchText,
    };
  });
}

function chooseBetterPlaceDisplay(currentValue, nextValue, key) {
  const knownValue = KNOWN_PLACE_DISPLAY[key];

  if (knownValue) {
    return knownValue;
  }

  if (!currentValue) {
    return nextValue;
  }

  const currentHasMixedCase = /[a-z][A-Z]/.test(currentValue);
  const nextHasMixedCase = /[a-z][A-Z]/.test(nextValue);

  if (currentHasMixedCase !== nextHasMixedCase) {
    return nextHasMixedCase ? nextValue : currentValue;
  }

  const currentAscii = transliterateTurkish(currentValue);
  const nextAscii = transliterateTurkish(nextValue);

  if (currentAscii.toLowerCase() === nextAscii.toLowerCase()) {
    return currentValue.length >= nextValue.length ? currentValue : nextValue;
  }

  return nextValue.length > currentValue.length ? nextValue : currentValue;
}

function normalizePersonCandidate(value) {
  const cleaned = normalizeWhitespace(value)
    .replace(/[;,]+$/g, '')
    .replace(/\s+/g, ' ');

  if (!cleaned) {
    return '';
  }

  const stripped = cleaned
    .replace(/^(?:ve|ile|with|and)\s+/i, '')
    .replace(/\s+(?:ve|ile|with|and)$/i, '')
    .trim();
  const normalizedKey = slugify(stripped);

  if (!normalizedKey || NAME_STOPWORDS.has(normalizedKey)) {
    return '';
  }

  const tokens = stripped.split(/\s+/).filter(Boolean);

  if (tokens.length === 1) {
    const token = tokens[0];
    const plainLength = slugify(token).replace(/\s+/g, '').length;

    if (plainLength < 4) {
      return '';
    }
  }

  return /[A-Za-zÇĞİÖŞÜçğıöşü]/u.test(stripped) ? stripped : '';
}

function normalizeSinglePersonValue(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue || /,|\/|&|\band\b|\bve\b|\bile\b/i.test(rawValue)) {
    return '';
  }

  return normalizePersonCandidate(rawValue);
}

function isCoordinateLike(value) {
  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(String(value || '').trim());
}

function createCanonicalPersonKey(value) {
  const normalized = slugify(value)
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '';
  }

  const tokens = normalized.split(' ').filter(Boolean);

  if (tokens.length >= 2 && tokens[0].length >= 4 && tokens[tokens.length - 1].length === 1) {
    tokens.pop();
  }

  return tokens.join(' ');
}

function createCanonicalPlaceKey(value) {
  return slugify(value);
}

function splitPersonValues(value) {
  return String(value || '')
    .split(/\s*(?:,|\/|&|\band\b|\bve\b|\bile\b)\s*/i)
    .map(normalizePersonCandidate)
    .filter(Boolean);
}

function extractNamesFromText(value) {
  const matches = String(value || '').match(
    /\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]{3,}(?:\s+[A-ZÇĞİÖŞÜ]\.)?(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]{3,})?\b/gu,
  );

  if (!matches) {
    return [];
  }

  return uniqueStrings(matches.map(normalizePersonCandidate).filter(Boolean));
}

function extractPlacesFromText(value) {
  const matches = String(value || '').match(
    /\b(?:at|near|from|in)\s+([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9' -]{2,})/gu,
  );

  if (!matches) {
    return [];
  }

  return uniqueStrings(
    matches.map((match) => match.replace(/^(at|near|from|in)\s+/i, '').trim()),
  );
}

function buildContent(entries, lookups) {
  return (
    findPriorityMatch(lookups.byLabel, ['text', 'tip', 'note', 'details']) ||
    findPriorityMatch(lookups.byName, ['text', 'tip', 'note', 'details']) ||
    findFirstMatch(lookups.byLabel, CONTENT_HINTS) ||
    findFirstMatch(lookups.byName, CONTENT_HINTS) ||
    entries.find((entry) => entry.value)?.value ||
    ''
  );
}

function buildSummary(sourceLabel, content, person, place) {
  const summaryParts = [sourceLabel];

  if (person) {
    summaryParts.push(person);
  }

  if (place) {
    summaryParts.push(`near ${place}`);
  }

  if (content) {
    summaryParts.push(content.slice(0, 120));
  }

  return summaryParts.join(' | ');
}

function findTimestampValue(lookups) {
  return (
    findPriorityMatch(lookups.byLabel, ['timestamp', 'time']) ||
    findPriorityMatch(lookups.byName, ['timestamp', 'time'])
  );
}

function buildPlaceEntities(fields, content) {
  const selectedPlaces = uniqueStrings([
    ...collectValuesByHints(fields, PLACE_HINTS),
    ...extractPlacesFromText(content),
  ]);
  const byKey = new Map();

  selectedPlaces.forEach((place) => {
    if (isCoordinateLike(place)) {
      return;
    }

    const key = createCanonicalPlaceKey(place);

    if (!key) {
      return;
    }

    const currentDisplay = byKey.get(key);
    byKey.set(key, chooseBetterPlaceDisplay(currentDisplay, place, key));
  });

  return [...byKey.entries()].map(([key, display]) => ({
    key,
    display,
  }));
}

function buildPersonEntities(fields, content, blockedPlaceKeys) {
  const hintedPeople = collectValuesByHints(fields, PERSON_HINTS).flatMap(splitPersonValues);
  const inferredPeople = hintedPeople.length > 0 ? [] : extractNamesFromText(content);
  const selectedPeople = [...hintedPeople, ...inferredPeople];
  const byKey = new Map();

  selectedPeople.forEach((person) => {
    const key = createCanonicalPersonKey(person);

    if (!key || blockedPlaceKeys.has(key)) {
      return;
    }

    const currentDisplay = byKey.get(key);
    byKey.set(key, chooseBetterDisplayName(currentDisplay, person));
  });

  return [...byKey.entries()].map(([key, display]) => ({
    key,
    display,
  }));
}

function createLeadTitle(sourceLabel, person, place) {
  if (person) {
    return person;
  }

  if (place) {
    return `${sourceLabel} at ${place}`;
  }

  return sourceLabel;
}

function scoreSuspicion(text) {
  const normalizedText = String(text || '').toLowerCase();

  return SUSPICIOUS_KEYWORDS.reduce((score, keyword) => {
    return normalizedText.includes(keyword) ? score + 1 : score;
  }, 0);
}

export function normalizeSubmission(source, submission) {
  const parsedAnswers = parseSubmissionAnswers(submission);
  const fields = parsedAnswers.entries.filter((entry) => entry.value !== '');
  const timestampValue = findTimestampValue(parsedAnswers);
  const createdAtRaw =
    timestampValue ||
    submission?.created_at ||
    submission?.updated_at ||
    submission?.createdAt ||
    submission?.updatedAt ||
    '';

  const rawPrimaryPlaceDisplay =
    findFirstMatch(parsedAnswers.byLabel, PLACE_HINTS) ||
    findFirstMatch(parsedAnswers.byName, PLACE_HINTS);
  const primaryPlaceDisplay = isCoordinateLike(rawPrimaryPlaceDisplay) ? '' : rawPrimaryPlaceDisplay;
  const content = buildContent(fields, parsedAnswers);
  const placeEntities = buildPlaceEntities(fields, content);
  const blockedPlaceKeys = new Set([
    createCanonicalPlaceKey(primaryPlaceDisplay),
    ...placeEntities.map((item) => item.key),
  ].filter(Boolean));
  const primaryPersonDisplay =
    normalizeSinglePersonValue(findPriorityMatch(parsedAnswers.byLabel, PERSON_FIELD_PRIORITY)) ||
    normalizeSinglePersonValue(findPriorityMatch(parsedAnswers.byName, PERSON_FIELD_PRIORITY)) ||
    normalizeSinglePersonValue(findFirstMatch(parsedAnswers.byLabel, PERSON_HINTS)) ||
    normalizeSinglePersonValue(findFirstMatch(parsedAnswers.byName, PERSON_HINTS));
  const personEntities = buildPersonEntities(fields, content, blockedPlaceKeys);
  const primaryPersonKey = createCanonicalPersonKey(primaryPersonDisplay);
  const primaryPlaceKey = createCanonicalPlaceKey(primaryPlaceDisplay);
  const safePrimaryPerson =
    primaryPersonKey && !blockedPlaceKeys.has(primaryPersonKey) ? primaryPersonDisplay : '';
  const primaryPersonEntity = personEntities.find((item) => item.key === primaryPersonKey);
  const person = primaryPersonEntity?.display || safePrimaryPerson || '';
  const personKey = safePrimaryPerson ? primaryPersonKey : '';
  const place = primaryPlaceDisplay || placeEntities[0]?.display || '';
  const placeKey = primaryPlaceKey || placeEntities[0]?.key || '';
  const relatedPeople = personEntities.map((item) => item.display);
  const relatedPersonKeys = personEntities.map((item) => item.key);
  const relatedPlaces = placeEntities.map((item) => item.display);
  const relatedPlaceKeys = placeEntities.map((item) => item.key);
  const textBlob = [person, place, content, ...fields.map((field) => field.value)].join(' ');
  const suspicionScore = scoreSuspicion(textBlob);
  const summary = buildSummary(source.label, content, person, place);
  const visibleSearchText = [
    source.label,
    person,
    place,
    summary,
    personKey,
    placeKey,
  ]
    .join(' ')
    .toLowerCase();
  const title = createLeadTitle(source.label, person, place);

  return {
    id: `${source.key}-${submission?.id || submission?.submission_id || crypto.randomUUID()}`,
    submissionId: String(submission?.id || submission?.submission_id || ''),
    source: source.key,
    sourceLabel: source.label,
    formId: source.formId,
    createdAt: normalizeDate(createdAtRaw),
    createdAtRaw,
    sortAt: parseFlexibleDate(createdAtRaw)?.getTime() || 0,
    status: submission?.status || '',
    fields,
    fieldsByLabel: parsedAnswers.byLabel,
    fieldsByName: parsedAnswers.byName,
    title,
    person,
    personKey,
    place,
    placeKey,
    content,
    summary,
    relatedPeople,
    relatedPersonKeys,
    relatedPlaces,
    relatedPlaceKeys,
    suspicionScore,
    searchText: visibleSearchText,
    raw: submission,
  };
}

export function normalizeInvestigationSources(sourceResponses) {
  const records = sourceResponses.flatMap((source) => {
    return source.submissions.map((submission) => normalizeSubmission(source, submission));
  });
  const canonicalizedRecords = applyCanonicalPersonAliases(records);

  return canonicalizedRecords.sort((left, right) => {
    return right.sortAt - left.sortAt;
  });
}
