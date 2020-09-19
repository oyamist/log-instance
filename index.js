module.exports = {
    logger: require('./src/log-instance').singleton,
    terseLogger: require('./src/log-instance').terseSingleton,
    LogInstance: require('./src/log-instance'),

};
