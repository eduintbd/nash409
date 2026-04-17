import { logger } from './logger';

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      logger.warn('safeStorage.getItem failed', key, err);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      logger.warn('safeStorage.setItem failed', key, err);
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      logger.warn('safeStorage.removeItem failed', key, err);
    }
  },
};
