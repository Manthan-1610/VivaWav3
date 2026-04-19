/**
 * Ensures JSON payloads are plain data (Requirement 3 round-trip):
 * structured values survive JSON.stringify → JSON.parse unchanged.
 */
export function roundTripJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
