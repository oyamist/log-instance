import { default as LogInstance } from './src/log-instance.js';

export const logger = LogInstance.singleton;
export const terseLogger = LogInstance.terseSingleton;
export default LogInstance;

