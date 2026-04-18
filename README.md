# Missing Podo: The Ankara Case

Participant: `Muhittin Arda Aksakal`

Missing Podo is a React + Vite investigation dashboard built for the Jotform frontend challenge. The app pulls live submissions from five Jotform forms, normalizes mixed response shapes into a usable investigation record model, and turns them into a searchable case workspace instead of a raw JSON dump.

## Core Features

- live Jotform API integration for Checkins, Messages, Sightings, Personal Notes, and Anonymous Tips
- answer parsing and normalization into a shared record structure
- investigation-focused master/detail workflow
- source, person, place, and text filtering
- linked record exploration across sources
- clickable summary insights for suspicious leads, repeated places, and Podo-linked activity
- synchronized map view for coordinate-based records
- compact Podo Trail panel for the last seen chain
- loading, error, empty, and safe fallback states

## Tech Stack

- React
- Vite
- JavaScript
- native `fetch`
- plain CSS

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the repository root.

3. Add the following environment variables:

```bash
VITE_JOTFORM_API_KEY=YOUR_API_KEY
VITE_CHECKINS_FORM_ID=261065067494966
VITE_MESSAGES_FORM_ID=261065765723966
VITE_SIGHTINGS_FORM_ID=261065244786967
VITE_NOTES_FORM_ID=261065509008958
VITE_TIPS_FORM_ID=261065875889981
```

4. Start the development server:

```bash
npm run dev
```

5. Create a production build:

```bash
npm run build
```

## Environment Variables

- `VITE_JOTFORM_API_KEY`
- `VITE_CHECKINS_FORM_ID`
- `VITE_MESSAGES_FORM_ID`
- `VITE_SIGHTINGS_FORM_ID`
- `VITE_NOTES_FORM_ID`
- `VITE_TIPS_FORM_ID`

## Commands

```bash
npm install
npm run dev
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
    PodoTrail.jsx
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

- `src/api/jotform.js` fetches all available submissions for each form with pagination-aware requests.
- `src/utils/normalize.js` converts raw Jotform answers into stable investigation records, person/place keys, and UI-friendly labels.
- `src/utils/investigation.js` derives filter options, linked records, summary cards, and the Podo Trail.
- `src/App.jsx` coordinates loading, filters, selection, and high-level layout state.

## Investigation Approach

The app is designed around a record-first investigation flow:

- use the left column to narrow the case with text, source, person, and place filters
- inspect one lead at a time in the right-side detail panel
- follow related records grouped by source to understand cross-source connections
- use the Podo Trail as a compact timeline for the last visible chain of Podo mentions

This solution keeps heuristics intentionally conservative. When the data is ambiguous, the UI prefers neutral titles and stable grouping over aggressive guessing.

## Notes

- Do not commit `.env.local`.
- Do not hardcode the API key in source files.
- `.env.example` contains placeholders only.
