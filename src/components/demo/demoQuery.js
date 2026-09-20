export function matches(row, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some(q => matches(row,q));
    if (key === '$and') return value.every(q => matches(row,q));
    const actual = key.split('.').reduce((v,k) => v?.[k], row);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return actual === value;
    return Object.entries(value).every(([op,v]) => {
      switch(op) {
        case '$in': return v.includes(actual);
        case '$nin': return !v.includes(actual);
        case '$ne': return actual !== v;
        case '$eq': return actual === v;
        case '$gte': return actual >= v;
        case '$gt': return actual > v;
        case '$lte': return actual <= v;
        case '$lt': return actual < v;
        case '$exists': return (actual !== undefined) === v;
        default: throw new Error(`Filter demo tidak didukung: ${op}`);
      }
    });
  });
}
export function applyUpdate(row, data) {
  if (!Object.keys(data).some(k=>k.startsWith('$'))) return {...row,...data};
  const next = {...row,...data.$set};
  Object.entries(data.$inc || {}).forEach(([k,v]) => next[k] = Number(next[k] || 0) + v);
  Object.keys(data.$unset || {}).forEach(k => delete next[k]);
  Object.entries(data.$push || {}).forEach(([k,v]) => next[k] = [...(next[k] || []),v]);
  return next;
}