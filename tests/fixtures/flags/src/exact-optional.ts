export interface Options {
  name?: string;
}

// Fails only under exactOptionalPropertyTypes: `name?: string` allows the key
// to be missing, not to be present with the value undefined.
export const options: Options = { name: undefined };
