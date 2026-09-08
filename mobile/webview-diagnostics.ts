// Installed before the embedded document executes, including before syntax errors.
// No original message, URL, stack, promise rejection, or DOM text crosses the bridge.
export const webViewDiagnosticsScript = `
(function () {
  if (window.__MENO_DIAGNOSTICS__) return;
  window.__MENO_DIAGNOSTICS__ = true;
  var count = 0;
  function report(kind, error, line, column) {
    if (++count > 10) return;
    var allowed = ['Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'RangeError', 'URIError', 'EvalError'];
    var name = error && allowed.indexOf(error.name) >= 0 ? error.name : 'Error';
    var integer = function(value) { return Number.isInteger(value) && value > 0 && value < 1000000 ? value : 0; };
    try { window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'webview-error', kind: kind, errorType: name,
      line: integer(line), column: integer(column)
    })); } catch (_) {}
  }
  window.addEventListener('error', function(event) { report('javascript', event.error, event.lineno, event.colno); });
  window.addEventListener('unhandledrejection', function(event) { report('promise', event.reason, 0, 0); });
})();
true;
`;

export function webViewDiagnosticError(input: Record<string, unknown>) {
  const name = ['Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'RangeError', 'URIError', 'EvalError'].includes(String(input.errorType)) ? String(input.errorType) : 'Error';
  const location = (value: unknown) => Number.isInteger(value) && Number(value) > 0 && Number(value) < 1_000_000 ? Number(value) : 0;
  const error = new Error('An embedded app operation failed.');
  error.name = name;
  error.stack = `${name}: An embedded app operation failed.\n    at embeddedApp (menlopass.html:${location(input.line)}:${location(input.column)})`;
  return error;
}
