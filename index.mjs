import { default as LOG_INSTANCE } from './src/log-instance.mjs';

export const LogInstance = LOG_INSTANCE;
export const logger = LogInstance.singleton;
export const terseLogger = LogInstance.terseSingleton;
export default LogInstance;

