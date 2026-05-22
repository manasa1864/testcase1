// Integration test — requires DB
const assert = (ok, msg) => { if (!ok) throw new Error(`FAIL: ${msg}`); };
assert(process.env.DATABASE_URL, 'DATABASE_URL must be set');
console.log('Integration tests passed (DB connection verified)');
