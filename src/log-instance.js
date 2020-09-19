(function(exports) {
    var singleton;
    var terseSingleton;
    const LEVEL_FORMAT_NONE = 0;
    const LEVEL_FORMAT_COMPACDT = 0;
    const LEVEL_FORMAT = {
        none: 0,
        compact: 1,
        auto: 2,
        full: 3,
    }
    const LEVEL_ABBREVIATIONS = {
        debug: ["","D","D","DEBUG"],
        info: ["","I","I","INFO"],
        warn: ["","W","WARN","WARN"],
        error: ["","E","ERROR","ERROR"],
    }


    class LogInstance {
        constructor(opts={}) {
            this.name = opts.name || "LogInstance";
            this.timestampFormat = opts.timestampFormat === undefined
                ? 'YYYYMMDD HH:mm:ss'
                : opts.timestampFormat;
            this.levelFormat = LEVEL_FORMAT[opts.levelFormat] === undefined
                ? LEVEL_FORMAT.auto
                : LEVEL_FORMAT[opts.levelFormat];
            this.logger = this;
            this.levels = opts.levels || {
                any: {
                    priority: -2,
                },
                debug: {
                    handler: console.debug,
                    priority: -1,
                },
                info: {
                    handler: console.log,
                    priority: 0,
                },
                warn: {
                    handler: console.warn,
                    priority: 1,
                },
                error: {
                    handler: console.error,
                    priority: 2,
                },
                none: {
                    handler: () => {},
                    priority: 3,
                },
            }
            this.level = opts.logLevel || opts.level || 'info';
            this._lastLog = {};
        }

        static get singleton() {
            singleton = singleton || new LogInstance();
            return singleton;
        }

        static get terseSingleton() {
            terseSingleton = terseSingleton || new LogInstance({
                timestampFormat: '',
                levelFormat: 'none',
            });
            return terseSingleton;
        }

        static logInstance(inst, opts) {
            LogInstance.singleton.logInstance(inst, opts);
        }

        static timestamp(now=new Date(), timestampFormat) {
            return timestampFormat
                .replace(/YYYY/g, now.getUTCFullYear())
                .replace(/MM/g, `0${now.getUTCMonth()+1}`.slice(-2))
                .replace(/DD/g, `0${now.getUTCDate()}`.slice(-2))
                .replace(/HH/g, `0${now.getUTCHours()}`.slice(-2))
                .replace(/mm/g, `0${now.getUTCMinutes()}`.slice(-2))
                .replace(/ss/g, `0${now.getUTCSeconds()}`.slice(-2))
                ;
        }

        static assertNonLogger(obj) {
            var props = [ "_log", "logInstance", "logger", "logLevel", "lastLog",
                "debug", "info", "log", "warn", "error", ];
            props.forEach(prop=>{
                if (obj[prop]) {
                    throw new Error(`assertNonLogger() cannot override: ${prop}`);
                }
            });
        }

        static createLogger(parent, child, opts={}) {
            let logLevel = opts.hasOwnProperty("logLevel")
                ? opts.logLevel 
                : parent.logLevel;
            let doLog = (args,handlerLevel) => {
                let name = child.name || child.constructor.name;
                let logLevel = LogInstance.logLevel(child);
                args = args.slice();
                args.unshift(`${name}:`);
                parent._log.call(parent, handlerLevel, logLevel, args);
            };
            LogInstance.assertNonLogger(child);
            Object.defineProperty(child, '_log', {
                value: (...args)=> parent.logger._log.apply(parent.logger, args),
            });
            Object.defineProperty(child, 'logInstance', {
                value: (...args)=>{
                    LogInstance.createLogger.apply(null , [child, ...args]);
                },
            });
            Object.defineProperty(child, "logLevel", {
                enumerable: false,
                writable: true,
                value: opts.logLevel || false, // follow Logger
            });
            Object.defineProperty(child, 'lastLog', {
                value: (...args)=> parent.lastLog.apply(parent, args),
            });
            Object.defineProperty(child, 'logger', { value: parent, });
            ["log","info","debug","warn","error"].forEach(level=>{
                Object.defineProperty(child, level, {
                    value: (...args)=> {
                        doLog( args, level === 'log' ? 'info' : level);
                    },
                });
            });
        }

        get level() { // deprecated: use logLevel
            return this.logLevel;
        }

        set level(value) { // deprecated: use logLevel
            this.logLevel = value;
        }

        get logLevel() {
            return this._logLevel;
        }

        set logLevel(value) {
            if (!this.levels[value]) {
                throw new Error(`invalid logLevel:"${value}"`);
            }
            this._logLevel = value;
        }

        static logLevel(logger) {
            const MAX_LEVELS = 50;
            for (let i=0; i < MAX_LEVELS; i++) {
                if (logger.logLevel) {
                    return logger.logLevel;
                }
                logger = logger.logger;
            }
            throw new Error(
                `MAX_LEVELS logger nesting exceeded. MAX_LEVELS:${MAX_LEVELS}`);
        }

        levelAbbreviation(logLevel) {
            return LEVEL_ABBREVIATIONS[logLevel][this.levelFormat];
        }

        _log(handlerLevel, logLevel, args) {
            var { levels, timestampFormat} = this;
            var handler = levels[handlerLevel];
            logLevel = logLevel || LogInstance.logLevel(this);
            var levelInfo = levels[logLevel];
            if (!levelInfo) {
                throw new Error(`Invalid logLevel:${logLevel}`);
            }
            if (levelInfo.priority <= handler.priority) {
                var handlerArgs = args.slice();
                var abbreviation = this.levelAbbreviation(handlerLevel);
                abbreviation && handlerArgs.unshift(abbreviation);
                if (timestampFormat) {
                    let timestamp = LogInstance.timestamp(new Date(), timestampFormat);
                    handlerArgs.unshift(timestamp);
                }
                this._lastLog[handlerLevel] = handlerArgs;
                handler.handler.apply(undefined, handlerArgs);
            }
        }

        lastLog(level='info') {
            return (this._lastLog[level] || []).join(' ');
        }

        debug(...args) {
            this._log("debug", this.logLevel, args);
        }

        log(...args) {
            this._log("info", this.logLevel, args);
        }

        info(...args) {
            this._log("info", this.logLevel, args);
        }

        warn(...args) {
            this._log("warn", this.logLevel, args);
        }

        error(...args) {
            this._log("error", this.logLevel, args);
        }

        logInstance(child, opts={}) {
            return LogInstance.createLogger(this, child, opts);
        }

    } 

    module.exports = exports.LogInstance = LogInstance;
})(typeof exports === "object" ? exports : (exports = {}));

