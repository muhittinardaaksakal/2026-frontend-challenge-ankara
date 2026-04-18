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

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function startCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function extractNamesFromText(value) {
  const matches = String(value || '').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g);

  if (!matches) {
    return [];
  }

  return uniqueStrings(matches);
}

function extractPlacesFromText(value) {
  const matches = String(value || '').match(/\b(?:at|near|from|in)\s+([A-Z][A-Za-z0-9' -]{2,})/g);

  if (!matches) {
    return [];
  }

  return uniqueStrings(
    matches.map((match) => match.replace(/^(at|near|from|in)\s+/i, '').trim()),
  );
}

function buildContent(entries, lookups) {
  return (
    findFirstMatch(lookups.byLabel, CONTENT_HINTS) ||
    findFirstMatch(lookups.byName, CONTENT_HINTS) ||
    entries.find((entry) => entry.value)?.value ||
    ''
  );
}

function buildSummary(sourceLabel, fields, content, person, place) {
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

  return summaryParts.join(' • ');
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
  const createdAtRaw =
    submission?.created_at ||
    submission?.updated_at ||
    submission?.createdAt ||
    submission?.updatedAt ||
    '';

  const primaryPerson =
    findFirstMatch(parsedAnswers.byLabel, PERSON_HINTS) ||
    findFirstMatch(parsedAnswers.byName, PERSON_HINTS);
  const primaryPlace =
    findFirstMatch(parsedAnswers.byLabel, PLACE_HINTS) ||
    findFirstMatch(parsedAnswers.byName, PLACE_HINTS);
  const content = buildContent(fields, parsedAnswers);
  const textBlob = [primaryPerson, primaryPlace, content, ...fields.map((field) => field.value)].join(' ');
  const relatedPeople = uniqueStrings([
    ...collectValuesByHints(fields, PERSON_HINTS),
    ...extractNamesFromText(content),
  ]);
  const relatedPlaces = uniqueStrings([
    ...collectValuesByHints(fields, PLACE_HINTS),
    ...extractPlacesFromText(content),
  ]);
  const suspicionScore = scoreSuspicion(textBlob);

  return {
    id: `${source.key}-${submission?.id || submission?.submission_id || crypto.randomUUID()}`,
    submissionId: String(submission?.id || submission?.submission_id || ''),
    source: source.key,
    sourceLabel: source.label,
    formId: source.formId,
    createdAt: normalizeDate(createdAtRaw),
    createdAtRaw,
    status: submission?.status || '',
    fields,
    fieldsByLabel: parsedAnswers.byLabel,
    fieldsByName: parsedAnswers.byName,
    person: primaryPerson || relatedPeople[0] || '',
    place: primaryPlace || relatedPlaces[0] || '',
    content,
    summary: buildSummary(source.label, fields, content, primaryPerson, primaryPlace),
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
    return new Date(right.createdAtRaw || 0).getTime() - new Date(left.createdAtRaw || 0).getTime();
  });
}
