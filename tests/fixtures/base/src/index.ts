const greeting: string = "hello";
const values: string[] = [];

// This must remain an error while noUncheckedIndexedAccess is inherited.
// @ts-expect-error An indexed value can be undefined.
const first: string = values[0];

export { first, greeting };
