export function stripUndefinedFields<T extends object>(value: T): T {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return Object.fromEntries(entries) as T;
}
