declare namespace JSX {
  interface IntrinsicElements {
    main: {
      children?: unknown
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      main: {
        children?: unknown
      }
    }
  }

  export const Fragment: unique symbol
  export function jsx(type: unknown, props: unknown): unknown
  export function jsxs(type: unknown, props: unknown): unknown
}
