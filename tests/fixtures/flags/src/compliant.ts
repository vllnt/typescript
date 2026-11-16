// The accepted form of each pattern in the sibling fixtures. It must compile
// with every flag on.
export class Base {
  run(): string {
    return "base";
  }
}

export class Derived extends Base {
  override run(): string {
    return "derived";
  }
}

export function describeSign(value: number) {
  if (value > 0) {
    return "positive";
  }
  return undefined;
}

// Empty cases that share a body are not fallthrough.
export function spell(value: number): string {
  switch (value) {
    case 1:
    case 2:
      return "few";
    default:
      return "many";
  }
}

export interface Options {
  name?: string | undefined;
  size?: number;
}

export const withUndefined: Options = { name: undefined };
export const withoutKey: Options = {};
