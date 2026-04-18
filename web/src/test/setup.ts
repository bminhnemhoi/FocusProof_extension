import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

// Reset localStorage giữa các test để tránh leak state.
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});
