export function getRelatedItems(record, people, events) {
  if (!record) {
    return {
      people: [],
      events: [],
    };
  }

  return {
    people: people.filter((person) => record.personIds.includes(person.id)),
    events: events.filter((event) => record.eventIds.includes(event.id)),
  };
}
