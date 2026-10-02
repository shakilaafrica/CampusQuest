import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, value: () => {} });
Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { configurable: true, value: () => {} });
