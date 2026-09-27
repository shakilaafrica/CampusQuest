// Local ambient declarations for the student-wellness level.
// Vite treats these extensions as static assets at build time; these
// declarations only exist so `tsc` accepts the `import x from '…jfif'`
// syntax without depending on `vite/client` being wired into tsconfig.

declare module '*.jfif' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}
