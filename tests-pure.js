/**
 * Testes unitários das funções puras — executar no browser:
 *   window.runPureTests()
 * ou: node-less via inclusão em index só em ?test=1
 */
function runPureTests() {
  const results = [];
  const assert = (name, cond) => {
    results.push({ name, ok: !!cond });
    if (!cond) console.error('FAIL', name);
    else console.info('OK', name);
  };

  // escHtml
  if (typeof escHtml === 'function') {
    assert('escHtml escapes <', escHtml('<script>') === '&lt;script&gt;');
    assert('escHtml escapes &', escHtml('a&b') === 'a&amp;b');
    assert('escHtml escapes quote', escHtml('"x"').includes('&quot;'));
  } else {
    assert('escHtml exists', false);
  }

  // fmtKz
  if (typeof fmtKz === 'function') {
    assert('fmtKz 1000', fmtKz(1000).includes('1.000'));
    assert('fmtKz 0', fmtKz(0).includes('0'));
  }

  // uuid shape
  if (typeof uuid === 'function') {
    const id = uuid();
    assert('uuid length', id && id.length >= 32);
  }

  // hoje ISO date
  if (typeof hoje === 'function') {
    assert('hoje format', /^\d{4}-\d{2}-\d{2}$/.test(hoje()));
  }

  // nextReciboNum increments
  if (typeof nextReciboNum === 'function') {
    const a = nextReciboNum();
    const b = nextReciboNum();
    assert('recibo increments', a !== b);
  }

  const failed = results.filter(r => !r.ok).length;
  console.info('[PureTests] ' + (results.length - failed) + '/' + results.length + ' passou');
  return { total: results.length, failed, results };
}

window.runPureTests = runPureTests;
