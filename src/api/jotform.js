const JOTFORM_API_BASE_URL = 'https://api.jotform.com';
const DEFAULT_PAGE_SIZE = 20;

const SOURCE_CONFIG = [
  {
    key: 'checkins',
    label: 'Checkins',
    formId: import.meta.env.VITE_CHECKINS_FORM_ID,
  },
  {
    key: 'messages',
    label: 'Messages',
    formId: import.meta.env.VITE_MESSAGES_FORM_ID,
  },
  {
    key: 'sightings',
    label: 'Sightings',
    formId: import.meta.env.VITE_SIGHTINGS_FORM_ID,
  },
  {
    key: 'notes',
    label: 'Personal Notes',
    formId: import.meta.env.VITE_NOTES_FORM_ID,
  },
  {
    key: 'tips',
    label: 'Anonymous Tips',
    formId: import.meta.env.VITE_TIPS_FORM_ID,
  },
];

function getApiKey() {
  const apiKey = import.meta.env.VITE_JOTFORM_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'Missing Jotform API key. Create a .env.local file and set VITE_JOTFORM_API_KEY before starting the app.',
    );
  }

  return apiKey;
}

function assertSourceConfig() {
  const missingFormIds = SOURCE_CONFIG.filter((source) => !source.formId).map((source) => source.key);

  if (missingFormIds.length > 0) {
    throw new Error(`Missing Jotform form IDs for: ${missingFormIds.join(', ')}`);
  }
}

async function requestJotform(pathname, searchParams = {}) {
  const apiKey = getApiKey();
  const url = new URL(pathname, JOTFORM_API_BASE_URL);
  url.searchParams.set('apiKey', apiKey);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Jotform request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (payload.responseCode && payload.responseCode >= 400) {
    throw new Error(payload.message || 'Jotform returned an error response.');
  }

  return payload;
}

function dedupeSubmissions(submissions) {
  const seenIds = new Set();

  return submissions.filter((submission) => {
    const submissionId = String(submission?.id || submission?.submission_id || '');

    if (!submissionId || seenIds.has(submissionId)) {
      return false;
    }

    seenIds.add(submissionId);
    return true;
  });
}

async function fetchAllFormSubmissions(source) {
  let offset = 0;
  let hasMore = true;
  let latestPayload = null;
  const collectedSubmissions = [];

  while (hasMore) {
    const payload = await requestJotform(`/form/${source.formId}/submissions`, {
      limit: DEFAULT_PAGE_SIZE,
      offset,
    });
    const submissions = Array.isArray(payload.content) ? payload.content : [];

    collectedSubmissions.push(...submissions);
    latestPayload = payload;

    if (submissions.length < DEFAULT_PAGE_SIZE) {
      hasMore = false;
    } else {
      offset += DEFAULT_PAGE_SIZE;
    }
  }

  return {
    ...source,
    submissions: dedupeSubmissions(collectedSubmissions),
    response: latestPayload,
  };
}

export async function getInvestigationSubmissions() {
  assertSourceConfig();

  const sources = await Promise.all(SOURCE_CONFIG.map(fetchAllFormSubmissions));

  return {
    sources,
    fetchedAt: new Date().toISOString(),
  };
}

export { SOURCE_CONFIG };
