'use strict';
const assert = require('node:assert/strict');
const ts = require('typescript');
function tokens(text) {
  const source = ts.createSourceFile('mutation.js', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const result = [];
  function visit(node) {
    const children = node.getChildren(source);
    if (children.length) {
      for (const child of children) visit(child);
    } else if (node.kind <= ts.SyntaxKind.LastToken && node.getWidth(source) > 0) {
      result.push({ kind: node.kind, text: node.getText(source), start: node.getStart(source), end: node.end });
    }
  }
  visit(source);
  return result;
}
// Exact token anchors survive formatter whitespace without broad textual matches.
function replaceMutation(source, original, replacement, label) {
  const haystack = tokens(source),
    needle = tokens(original),
    matches = [];
  assert.ok(needle.length > 0, 'Mutation needs a nonempty token anchor');
  for (let index = 0; index <= haystack.length - needle.length; index++) {
    if (
      needle.every(
        (token, offset) => token.kind === haystack[index + offset].kind && token.text === haystack[index + offset].text
      )
    )
      matches.push(index);
  }
  assert.equal(matches.length, 1, 'Mutation ' + label + ' must match exactly once');
  const start = haystack[matches[0]].start,
    end = haystack[matches[0] + needle.length - 1].end;
  return source.slice(0, start) + replacement + source.slice(end);
}
module.exports = { replaceMutation };
