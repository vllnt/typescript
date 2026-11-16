// Fails only under noImplicitReturns: when `value` is not positive the
// function falls off the end and returns undefined without saying so.
export function describeSign(value: number) {
  if (value > 0) {
    return "positive";
  }
}
