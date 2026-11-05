import numbers from 'go-numbers';

const nullableValues = [1, null].map((value) => numbers.parseFinite(value, null));
// @ts-expect-error the result remains possibly absent under unchecked-index protection
const indexed: number | null = nullableValues[0];
try {
  numbers.round(1, Infinity);
} catch (error) {
  // @ts-expect-error caught errors remain unknown rather than implicit any
  const message = error.message;
  if (error instanceof Error) {
    const message: string = error.message;
  }
}
