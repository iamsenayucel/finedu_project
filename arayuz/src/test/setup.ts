import "@testing-library/jest-dom/vitest";

// jsdom, framer-motion'ın useReducedMotion() gibi hook'larının dayandığı
// window.matchMedia'yı implemente etmiyor — framer-motion kullanan sayfaları
// (Login, Register, Dashboard, ...) render edebilmek için minimal bir stub.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}
