function add(a, b) { return a + b; }
function isEven(n) { return n % 2 === 0; }
function paginate(arr, page = 1, size = 10) {
  const start = (page - 1) * size;
  return { data: arr.slice(start, start + size), page, size, total: arr.length };
}
function slugify(s) { return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
module.exports = { add, isEven, paginate, slugify };
