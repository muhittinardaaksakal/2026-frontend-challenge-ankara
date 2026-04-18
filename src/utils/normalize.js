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
  'mentioned people',
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
  'yan',
  'yanindaki',
  'yanındaki',
  'yakininda',
  'yakınında',
  'buradaki',
  'herkes',
  'kalabalik',
  'kalabalık',
  'messages',
  'checkins',
  'sightings',
  'personal',
  'notes',
  'anonymous',
  'tips',
  'submit',
]);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü]+/g, ' ')
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

function normalizePersonCandidate(value) {
  const cleaned = normalizeWhitespace(value).replace(/[;,]+$/g, '');

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
    const plainLength = token.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '').length;

    if (plainLength < 4) {
      return '';
    }
  }

  return /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(stripped) ? stripped : '';
}

function splitPersonValues(value) {
  return String(value || '')
    .split(/\s*(?:,|\/|&|\band\b|\bve\b|\bile\b)\s*/i)
    .map(normalizePersonCandidate)
    .filter(Boolean);
}

function extractNamesFromText(value) {
  const matches = String(value || '').match(
    /\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]{3,}(?:\s+[A-ZÇĞİÖŞÜ]\.)?(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]{3,})?\b/g,
  );

  if (!matches) {
    return [];
  }

  return uniqueStrings(matches.map(normalizePersonCandidate).filter(Boolean));
}

function extractPlacesFromText(value) {
  const matches = String(value || '').match(
    /\b(?:at|near|from|in)\s+([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9' -]{2,})/g,
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

function buildRelatedPeople(fields, content) {
  const hintedPeople = collectValuesByHints(fields, PERSON_HINTS).flatMap(splitPersonValues);
  const inferredPeople = hintedPeople.length > 0 ? [] : extractNamesFromText(content);

  return uniqueStrings([...hintedPeople, ...inferredPeople]);
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

  const primaryPerson =
    normalizePersonCandidate(findPriorityMatch(parsedAnswers.byLabel, PERSON_FIELD_PRIORITY)) ||
    normalizePersonCandidate(findPriorityMatch(parsedAnswers.byName, PERSON_FIELD_PRIORITY)) ||
    normalizePersonCandidate(findFirstMatch(parsedAnswers.byLabel, PERSON_HINTS)) ||
    normalizePersonCandidate(findFirstMatch(parsedAnswers.byName, PERSON_HINTS));
  const primaryPlace =
    findFirstMatch(parsedAnswers.byLabel, PLACE_HINTS) ||
    findFirstMatch(parsedAnswers.byName, PLACE_HINTS);
  const content = buildContent(fields, parsedAnswers);
  const relatedPeople = buildRelatedPeople(fields, content);
  const relatedPlaces = uniqueStrings([
    ...collectValuesByHints(fields, PLACE_HINTS),
    ...extractPlacesFromText(content),
  ]);
  const textBlob = [primaryPerson, primaryPlace, content, ...fields.map((field) => field.value)].join(' ');
  const suspicionScore = scoreSuspicion(textBlob);

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
    person: primaryPerson || relatedPeople[0] || '',
    place: primaryPlace || relatedPlaces[0] || '',
    content,
    summary: buildSummary(source.label, content, primaryPerson || relatedPeople[0] || '', primaryPlace || relatedPlaces[0] || ''),
    relatedPeople,
    relatedPlaces,
    suspicionScore,
    searchText: [source.label, content, primaryPerson, primaryPlace, ...relatedPeople, ...relatedPlaces]
      .join(' ')
      .toLowerCase(),
    raw: submission,
  };
}

export function normalizeInvestigationSources(sourceResponses) {
  const records = sourceResponses.flatMap((source) => {
    return source.submissions.map((submission) => normalizeSubmission(source, submission));
  });

  return records.sort((left, right) => {
    return right.sortAt - left.sortAt;
  });
}
