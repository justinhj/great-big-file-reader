import test from 'tape';

test('timing test', function (t) {
    t.plan(2);

    t.equal(typeof Date.now, 'function');
    var start = Date.now();

    setTimeout(function () {
        t.closeTo(Date.now() - start, 100);
    }, 100, 3);
});

async function someAsyncThing() {
  return Promise.resolve(true);
}

test('test using promises', async function (t) {
    const result = await someAsyncThing();
    t.equal(result, true);
    t.end();
});
