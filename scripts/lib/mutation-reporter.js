'use strict';

// Machine-readable test outcomes, not TAP scraped from console text. In
// particular, test:stdout is a record rather than executable reporter output.
module.exports = async function* mutationReporter(source) {
  for await (const event of source) {
    if (!['test:pass', 'test:fail', 'test:summary', 'test:stdout', 'test:stderr'].includes(event.type)) continue;
    const data = { ...event.data };
    if (data.details?.error) {
      const error = data.details.error;
      data.details = {
        ...data.details,
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          failureType: error.failureType,
          // Avoid recursive serialization of arbitrary/circular causes.
          causeMessage: typeof error.cause?.message === 'string' ? error.cause.message : undefined,
          causeCode: typeof error.cause?.code === 'string' ? error.cause.code : undefined
        }
      };
    }
    yield JSON.stringify({ type: event.type, data }) + '\n';
  }
};
