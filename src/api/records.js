import records from '../data/records.json';
import people from '../data/people.json';
import events from '../data/events.json';

const SIMULATED_DELAY_MS = 700;
const SHOULD_FAIL = false;

export function getRecordExplorerData() {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (SHOULD_FAIL) {
        reject(new Error('Failed to fetch local record data.'));
        return;
      }

      resolve({
        records,
        people,
        events,
      });
    }, SIMULATED_DELAY_MS);
  });
}
