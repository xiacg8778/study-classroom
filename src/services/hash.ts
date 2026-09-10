export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key)=>`${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}
export function stableHash(value: unknown): string { let hash = 2166136261; const input = canonicalJson(value); for (let i=0;i<input.length;i+=1){ hash ^= input.charCodeAt(i); hash = Math.imul(hash,16777619); } return `fnv1a-${(hash>>>0).toString(16).padStart(8,'0')}`; }
