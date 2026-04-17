export function filterRecords(records, searchTerm, statusFilter) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return records.filter((record) => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesSearch =
      normalizedSearch === '' ||
      record.id.toLowerCase().includes(normalizedSearch) ||
      record.title.toLowerCase().includes(normalizedSearch) ||
      record.description.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
}
