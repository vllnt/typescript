// Fails only under noFallthroughCasesInSwitch: `case 1` runs into `case 2`.
export function spell(value: number): string {
  let result = "";
  switch (value) {
    case 1:
      result += "one";
    case 2:
      result += "two";
      break;
    default:
      break;
  }
  return result;
}
