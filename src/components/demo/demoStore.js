import demoSeed, { DEMO_USER } from '@/components/demo/demoSeed';
import { matches, applyUpdate } from '@/components/demo/demoQuery';
const KEY = 'database';
let database;
const listeners = new Map();
function load() {
  if (!database) { const saved = window.sessionStorage.getItem(KEY); database = saved ? JSON.parse(saved) : demoSeed(); }
  return database;
}
export function record(data) {
  return { ...data, id: data.id || `demo-${crypto.randomUUID()}`, created_by_id:DEMO_USER.id, created_date:data.created_date || new Date().toISOString(), updated_date:new Date().toISOString() };
}
export function transact(change) {
  const previous = load();
  const draft = structuredClone(previous);
  const result = change(draft);
  window.sessionStorage.setItem(KEY,JSON.stringify(draft));
  database = draft;
  listeners.forEach((set, name) => {
    const before = new Map((previous[name] || []).map(row => [row.id, row]));
    const after = new Map((draft[name] || []).map(row => [row.id, row]));
    const events = [];
    after.forEach((row,id) => {
      if (JSON.stringify(row) !== JSON.stringify(before.get(id))) events.push({id,type:before.has(id)?'update':'create',data:structuredClone(row)});
    });
    before.forEach((row,id) => { if(!after.has(id)) events.push({id,type:'delete',data:structuredClone(row)}); });
    events.forEach(event => set.forEach(callback => queueMicrotask(()=>callback(event))));
  });
  return structuredClone(result);
}
export function readRows(name, query = {}, sort, limit = 5000, skip = 0) {
  const rows = structuredClone(load()[name] || []).filter(r => matches(r,query));
  if (sort) { const desc = sort.startsWith('-'); const key = sort.replace(/^-/, ''); rows.sort((a,b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (desc ? -1 : 1)); }
  return rows.slice(skip,skip+limit);
}
export function entity(name) {
  const api = {
    list: async (sort,limit,skip) => readRows(name,{},sort,limit,skip),
    filter: async (query,sort,limit,skip) => readRows(name,query,sort,limit,skip),
    get: async id => readRows(name,{id})[0] || null,
    create: async data => transact(db => { const row=record(data); (db[name] ||= []).push(row); return row; }),
    update: async (id,data) => transact(db => { const index=(db[name] || []).findIndex(r=>r.id===id); if(index<0) throw new Error('Data demo tidak ditemukan'); db[name][index]=record({...applyUpdate(db[name][index],data),id}); return db[name][index]; }),
    delete: async id => transact(db => { db[name]=(db[name] || []).filter(r=>r.id!==id); return {success:true}; }),
    deleteMany: async query => transact(db => { const before=(db[name] || []).length; db[name]=(db[name] || []).filter(r=>!matches(r,query)); return {deleted_count:before-db[name].length}; }),
    updateMany: async (query, data) => transact(db => { let count=0; db[name]=(db[name] || []).map(r=> { if(!matches(r,query)) return r; count++; return record(applyUpdate(r,data)); }); return {updated_count:count,has_more:false}; }),
    subscribe: callback => { if(!listeners.has(name)) listeners.set(name,new Set()); listeners.get(name).add(callback); return () => listeners.get(name).delete(callback); },
    schema: async () => ({type:'object',properties:{}}),
  };
  api.bulkCreate = async rows => transact(db => { const added=rows.map(record); (db[name] ||= []).push(...added); return added; });
  api.bulkUpdate = async rows => transact(db => { const updates=new Map(rows.map(r=>[r.id,r])); db[name]=(db[name] || []).map(r=>updates.has(r.id)?record({...r,...updates.get(r.id)}):r); return db[name].filter(r=>updates.has(r.id)); });
  return api;
}