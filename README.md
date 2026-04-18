# Missing Podo: The Ankara Case

React + Vite investigation dashboard for the Jotform frontend hackathon challenge.

The app pulls live submission data from five Jotform forms, normalizes mixed answer shapes into a shared record model, and presents the case as an investigation workspace instead of a raw JSON dump.

## What the app does

- fetches Checkins, Messages, Sightings, Personal Notes, and Anonymous Tips from the Jotform API
- safely parses each submission's `answers` object into readable label/value fields
- normalizes every submission into a shared investigation record shape
- links records through detected people and places
- supports search, source filtering, and person/place focus filtering
- shows loading, error, empty, and unselected states clearly

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root.

3. Copy the keys from `.env.example` and set your real Jotform API key:

```bash
VITE_JOTFORM_API_KEY=your_real_key_here
VITE_CHECKINS_FORM_ID=261065067494966
VITE_MESSAGES_FORM_ID=261065765723966
VITE_SIGHTINGS_FORM_ID=261065244786967
VITE_NOTES_FORM_ID=261065509008958
VITE_TIPS_FORM_ID=261065875889981
```

4. Start the app:

```bash
npm run dev
```

5. Production build:

```bash
npm run build
```

## Architecture

```text
src/
  api/
    jotform.js
  components/
    DetailPanel.jsx
    FilterBar.jsx
    LinkedRecordGroup.jsx
    RecordList.jsx
    SearchBar.jsx
    StateView.jsx
    SummaryBar.jsx
  utils/
    investigation.js
    normalize.js
  App.jsx
  index.css
```

- `src/api/jotform.js` handles Jotform requests and fetches all five form feeds with `Promise.all`.
- `src/utils/normalize.js` inspects submission answers and converts them into consistent records.
- `src/utils/investigation.js` derives summary data, filters, and linked records for the UI.
- `src/App.jsx` coordinates loading, selection, filters, and screen states.

## Investigation approach

The MVP is record-centric with a linked investigation detail view:

- top summary for quick case orientation
- left side for search and lead browsing
- right side for selected lead detail
- linked records grouped by source to reveal cross-source connections

Because Jotform field labels can vary by form, person and place extraction is intentionally heuristic and flexible. The app does not assume a single rigid schema; it builds useful summaries from field labels, field names, and readable answer values.

## Notes

- Do not commit `.env.local`.
- Do not hardcode the API key in source files.
- `.env.example` only contains placeholders and public form IDs.
