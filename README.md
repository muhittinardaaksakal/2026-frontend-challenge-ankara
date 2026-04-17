# Record Explorer Practice

This project is a small React + Vite practice app built as preparation for a Jotform-style frontend hackathon.

It is intentionally simple:

- React only
- Vite setup
- JavaScript only
- local mock JSON data
- no backend
- no global state library
- no routing

The goal of this project is not to be a final portfolio piece. Its real value is as a reusable reference for tomorrow's hackathon.

## What This Practice Project Covers

This project already demonstrates the core patterns that are likely to be useful in the actual case study:

- async data fetching from local mock data
- master-detail layout
- record selection
- related entity mapping
- search support
- status filtering
- loading state
- empty state
- error state
- small, maintainable component structure

## Project Structure

```text
src/
  api/
    records.js
  components/
    SearchBar.jsx
    FilterBar.jsx
    RecordList.jsx
    DetailPanel.jsx
    StateView.jsx
  data/
    records.json
    people.json
    events.json
  utils/
    relations.js
    filters.js
  App.jsx
  index.css
```

## How To Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Why This Is Useful For Tomorrow

Tomorrow's hackathon is likely to require a small but thoughtful frontend app built under time pressure. This project is useful because it gives you a ready mental model for how to approach that kind of task.

### Reusable approach

Use this same sequence tomorrow:

1. Read the data first.
2. Identify the main entities and relationships.
3. Decide the main exploration flow.
4. Build the core experience before polishing.
5. Handle loading, empty, and error states early.
6. Keep the component structure simple.

### Reusable architecture

You can reuse the same structure if tomorrow's dataset is similar:

- `api/` for fetching logic
- `components/` for UI pieces
- `utils/` for filtering and relation helpers
- `data/` only if the case uses local mock files
- `App.jsx` as the main coordinator

### Reusable UI pattern

This project uses a master-detail layout:

- list and controls on the left
- selected record detail on the right

That is a strong default when the task involves browsing multiple related records. If tomorrow's case is more person-centric than record-centric, you can flip the focus but keep the same basic pattern.

## What To Reuse Tomorrow

You should reuse the thinking, not blindly copy the exact UI.

The most reusable parts are:

- loading data with `useEffect`
- deriving filtered records with `useMemo`
- keeping selected item state in `App.jsx`
- resetting selection when filters change
- mapping related entities in utility functions
- using small presentational components

## What To Decide Fresh Tomorrow

Do not assume tomorrow's solution should look exactly like this project.

You should decide based on the actual prompt:

- what the primary entity is
- whether the detail panel should focus on a record, person, or event
- which filters matter most
- what information is most useful to show first
- whether a list-detail layout is still the best fit

## Suggested Hackathon Plan

Use a simple priority order:

### First 30 minutes

- set up the project
- inspect the README and data
- identify entities and relationships
- choose a simple layout

### Main build phase

- fetch data
- show records clearly
- make one thing selectable
- show related information
- add search and filtering
- add loading, empty, and error states

### Final cleanup

- improve spacing and hierarchy
- remove dead code
- make names clearer
- write a short README
- test the main flows once more

## If You Get Stuck Tomorrow

Fall back to the simplest useful version:

- one main list
- one selected detail panel
- one search input
- one filter
- related data shown in small grouped sections

That is much better than overengineering and running out of time.

## Interview Talking Points

If you need to explain your decisions, you can frame them like this:

- I prioritized the core exploration flow first.
- I kept state local because the app is small and manageable.
- I separated API, utility, and UI logic to keep the code readable.
- I used a master-detail layout because it makes related information easy to inspect.
- I added loading, empty, and error states because those are part of real frontend work, not just visual polish.

## Notes

This repository is a practice reference for a time-boxed frontend challenge. It is meant to help with:

- planning faster
- scoping better
- structuring React code cleanly
- explaining trade-offs with confidence
