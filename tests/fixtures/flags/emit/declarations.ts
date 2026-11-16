// Declaration emit prints the inferred return type. With
// exactOptionalPropertyTypes the optional property is printed as `count?: number`;
// without it, as `count?: number | undefined`. The JavaScript is the same.
export function copy(partial: Partial<{ count: number }>) {
  return { ...partial };
}
