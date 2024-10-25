const prefix = '[ugur]';

export const logger = {
  warn: (m, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(prefix, m, ...args);
    }
  },
  log: (m, ...args) => {
    console.log(prefix, m, ...args);
  },
  error: (m, ...args) => {
    console.error(prefix, m, ...args);
  },
  info: (m, ...args) => {
    console.info(prefix, m, ...args);
  }
};