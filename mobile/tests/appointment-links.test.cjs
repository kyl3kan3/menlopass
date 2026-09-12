const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'app-views.js'), 'utf8');
const start = source.indexOf("  document.addEventListener('click', ev=>{");
const end = source.indexOf("  document.addEventListener('input'", start);
const listener = source.slice(start, end);

for (const native of [true, false]) {
  test(`appointment source links preserve the brief in ${native ? 'native' : 'web'} mode`, () => {
    let click;
    const messages = [];
    const window = { __MENO_NATIVE__: native, ReactNativeWebView: { postMessage: text => messages.push(JSON.parse(text)) } };
    vm.runInNewContext(listener, { window, document: { addEventListener: (_, handler) => { click = handler; } }, closeSheet: () => assert.fail('must not close the brief'), handleAction: () => assert.fail('must not invoke a sheet action') });
    const markup = fs.readFileSync(path.join(root, 'app-companion.js'), 'utf8');
    const urls = [...markup.matchAll(/href="(https:\/\/(?:www\.nice\.org\.uk|www\.nhs\.uk)[^"]+)"/g)].map(match => match[1]);
    assert.equal(urls.length, 3);
    for (const url of urls) {
      let prevented = false;
      click({ target: { closest: selector => selector === 'a[href]' ? { href: url } : { dataset: { act: 'bg' } } }, preventDefault: () => { prevented = true; } });
      assert.equal(prevented, native);
    }
    assert.deepEqual(messages, native ? urls.map(url => ({ type: 'open-external-link', url })) : []);
  });
}

test('the shipped HTML includes the native link bridge', () => {
  assert.ok(fs.readFileSync(path.join(root, 'mobile/assets/menlopass.html'), 'utf8').includes(listener.trim()));
});
