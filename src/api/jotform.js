const JOTFORM_API_BASE_URL = 'https://api.jotform.com';

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

async function requestJotform(pathname) {
  const apiKey = getApiKey();
  const url = new URL(pathname, JOTFORM_API_BASE_URL);
  url.searchParams.set('apiKey', apiKey);

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

async function fetchFormSubmissions(source) {
  const payload = await requestJotform(`/form/${source.formId}/submissions`);
  const submissions = Array.isArray(payload.content) ? payload.content : [];

  return {
    ...source,
    submissions,
    response: payload,
  };
}

export async function getInvestigationSubmissions() {
  assertSourceConfig();

  const sources = await Promise.all(SOURCE_CONFIG.map(fetchFormSubmissions));

  return {
    sources,
    fetchedAt: new Date().toISOString(),
  };
}

export { SOURCE_CONFIG };
