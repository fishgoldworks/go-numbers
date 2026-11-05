'use strict';

const path = require('node:path');

/**
 * Assess a child test process. A mutation counts only when its named regression
 * test actually fails and a complete runner summary confirms that outcome.
 * File-level load errors, missing targets, skips, TODOs and process errors do not
 * establish either a valid baseline or a detected regression.
 */
function assessRun(run, pattern) {
  const result = {
    detected: false,
    baselinePassed: false,
    firstFailingTest: null,
    matchedPasses: 0,
    matchedFailures: 0,
    reason: ''
  };
  if (run.error || run.signal || (run.status !== 0 && run.status !== 1)) {
    return { ...result, reason: 'child process did not complete normally' };
  }
  let events;
  try {
    events = run.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
    if (
      events.some((event) => !event || typeof event.type !== 'string' || !event.data || typeof event.data !== 'object')
    )
      throw new Error('invalid event');
  } catch {
    return { ...result, reason: 'invalid machine-readable reporter output' };
  }
  const summaries = events.filter((event) => event.type === 'test:summary' && event.data.file === undefined);
  const summary = summaries.length === 1 ? summaries[0].data : undefined;
  const counts = summary?.counts;
  if (
    !counts ||
    !['tests', 'passed', 'failed', 'cancelled', 'skipped', 'todo'].every(
      (name) => Number.isSafeInteger(counts[name]) && counts[name] >= 0
    ) ||
    events.at(-1)?.data !== summary
  ) {
    return { ...result, reason: 'missing or incomplete final test summary' };
  }
  // A file-level wrapper can itself emit test:fail when module evaluation or
  // the process fails. It is not a registered regression test, even when a
  // broad name expression would happen to match the file path.
  const completedFiles = new Set(
    events
      .filter((event) => event.type === 'test:summary' && typeof event.data.file === 'string')
      .map((event) => event.data.file)
  );
  const expression = new RegExp(pattern);
  const outcomes = events.filter((event) => event.type === 'test:pass' || event.type === 'test:fail');
  const registered = outcomes.filter(
    (event) =>
      typeof event.data.name === 'string' &&
      typeof event.data.file === 'string' &&
      completedFiles.has(event.data.file) &&
      path.resolve(event.data.name) !== path.resolve(event.data.file) &&
      event.data.details?.type === 'test'
  );
  const observed = { tests: registered.length, passed: 0, failed: 0, cancelled: 0, skipped: 0, todo: 0 };
  for (const event of registered) {
    if (event.data.todo !== undefined && event.data.todo !== false) observed.todo++;
    else if (event.data.skip !== undefined && event.data.skip !== false) observed.skipped++;
    else if (event.type === 'test:pass') observed.passed++;
    else if (event.data.details?.error?.failureType === 'cancelledByParent') observed.cancelled++;
    else observed.failed++;
  }
  if (['tests', 'passed', 'failed', 'cancelled', 'skipped', 'todo'].some((name) => observed[name] !== counts[name])) {
    return { ...result, reason: 'test events do not match the final summary' };
  }
  const matched = registered.filter((event) => expression.test(event.data.name));
  const active = matched.filter(
    ({ data }) => (data.skip === undefined || data.skip === false) && (data.todo === undefined || data.todo === false)
  );
  const failures = active.filter(
    (event) => event.type === 'test:fail' && event.data.details.error?.failureType === 'testCodeFailure'
  );
  const passes = active.filter((event) => event.type === 'test:pass');
  const unrelatedFailure = outcomes.some(
    (event) =>
      event.type === 'test:fail' &&
      event.data.details?.error?.failureType !== 'subtestsFailed' &&
      !failures.includes(event)
  );
  result.matchedPasses = passes.length;
  result.matchedFailures = failures.length;
  result.firstFailingTest = failures[0]?.data.name ?? null;
  result.baselinePassed =
    run.status === 0 &&
    summary.success === true &&
    counts.failed === 0 &&
    counts.cancelled === 0 &&
    passes.length > 0 &&
    passes.length === matched.length;
  result.detected =
    run.status === 1 &&
    summary.success === false &&
    counts.failed > 0 &&
    counts.cancelled === 0 &&
    failures.length > 0 &&
    !unrelatedFailure &&
    active.length === matched.length;
  result.reason = result.detected
    ? 'selected regression test failed'
    : result.baselinePassed
      ? 'selected unmodified tests passed'
      : 'no valid named outcome, or a skipped, cancelled, TODO or unrelated failure occurred';
  return result;
}

module.exports = { assessRun };
