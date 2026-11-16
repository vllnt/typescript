export class Base {
  run(): string {
    return "base";
  }
}

// Fails only under noImplicitOverride: the method replaces Base.run without
// the `override` modifier.
export class Derived extends Base {
  run(): string {
    return "derived";
  }
}
