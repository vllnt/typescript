declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      button: {
        children?: unknown
        disabled?: boolean
      }
    }
  }

  export const Fragment: unique symbol
  export function jsx(type: unknown, props: unknown): unknown
  export function jsxs(type: unknown, props: unknown): unknown
}
