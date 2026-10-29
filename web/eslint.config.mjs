const G = {};
for (const n of `window document navigator localStorage sessionStorage performance requestAnimationFrame cancelAnimationFrame
setTimeout clearTimeout setInterval clearInterval console Image Audio AudioContext webkitAudioContext OfflineAudioContext
HTMLCanvasElement HTMLElement CanvasRenderingContext2D ImageData getComputedStyle matchMedia screen location history URL Blob
fetch alert confirm prompt devicePixelRatio innerWidth innerHeight ResizeObserver MutationObserver IntersectionObserver
PointerEvent KeyboardEvent MouseEvent TouchEvent Event CustomEvent DOMParser btoa atob TextEncoder TextDecoder structuredClone
queueMicrotask crypto indexedDB Worker WebGLRenderingContext WebGL2RenderingContext OffscreenCanvas createImageBitmap THREE
visualViewport getSelection Path2D DOMMatrix FileReader caches globalThis addEventListener removeEventListener scrollTo
gc onerror Node Element SVGElement URLSearchParams Option Map Set WeakMap WeakSet Promise Symbol Proxy Reflect Intl
CompressionStream DecompressionStream Response`.split(/\s+/)) if (n) G[n] = 'readonly';
export default [{
  files: ['build/main.js'],
  languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: G },
  rules: {
    'no-undef': 'error', 'no-dupe-keys': 'error', 'no-const-assign': 'error', 'no-dupe-args': 'error',
    'no-unreachable': 'warn', 'no-self-assign': 'warn', 'no-cond-assign': 'off', 'no-redeclare': 'off',
    'use-isnan': 'error', 'valid-typeof': 'error', 'no-unsafe-negation': 'error', 'no-func-assign': 'off',
    'no-obj-calls': 'error', 'no-sparse-arrays': 'warn', 'no-unexpected-multiline': 'error', 'no-compare-neg-zero': 'error',
    'no-loss-of-precision': 'warn', 'no-dupe-else-if': 'warn', 'no-import-assign': 'error', 'no-setter-return': 'error',
    'no-with': 'error', 'no-delete-var': 'error', 'no-shadow-restricted-names': 'error'
  }
}];
