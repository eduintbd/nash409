const DEV = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (DEV) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (DEV) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (DEV) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (DEV) console.error(...args);
  },
};
