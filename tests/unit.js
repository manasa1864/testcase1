const { add, isEven, paginate, slugify } = require('../src/utils');
let p = 0;
function ok(cond, msg) {
  if (cond) { console.log('  ✓', msg); p++; }
  else { console.error('  ✗ FAIL:', msg); process.exit(1); }
}
ok(add(1, 2) === 3, 'add');
ok(isEven(4), 'isEven even');
ok(!isEven(3), 'isEven odd');
ok(paginate([1,2,3,4,5], 1, 2).data.length === 2, 'paginate');
ok(slugify('Hello World') === 'hello-world', 'slugify');
console.log(`\n  ${p}/5 passed ✓`);
