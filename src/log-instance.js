(function(exports) {
    var singleton;

    class LogInstance {
        constructor(opts={}) {
            this.name = opts.name || "LogInstance";
            this.timestampFormat = opts.timestampFormat || 'YYYYMMDD HH:mm:ss';
            this.logger = this;
            this.levels = opts.levels || {
                any: {
                    priority: -2,
                },
                debug: {
                    handler: console.debug,
                    abbreviation: "D",
                    priority: -1,
                },
                info: {
                    handler: console.log,
                    abbreviation: "I",
                    priority: 0,
                },
                warn: {
                    handler: console.warn,
                    abbreviation: "WARN",
                    priority: 1,
                },
                error: {
                    handler: console.error,
                    abbreviation: "ERROR",
                    priority: 2,
                },
                none: {
                    handler: () => {},
                    abbreviation: "NONE",
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

        _log(handlerLevel, logLevel, args) {
            var { levels, timestampFormat } = singleton;
            var handler = levels[handlerLevel];
            if (levels[logLevel].priority <= handler.priority) {
                var timestamp = LogInstance.timestamp(new Date(), timestampFormat);
                var handlerArgs = [timestamp, handler.abbreviation, ...args];
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

        info(...args) {
            this._log("info", this.logLevel, args);
        }

        warn(...args) {
            this._log("warn", this.logLevel, args);
        }

        error(...args) {
            this._log("error", this.logLevel, args);
        }

        logInstance(inst, opts={}) {
            var that = this;
            let logLevel = opts.hasOwnProperty("logLevel")
                ? opts.logLevel 
                : that.logLevel;
            let addName = opts.addName !== false;
            let doLog = (args,handlerLevel) => {
                let name = inst.name || inst.constructor.name;
                let logLevel = inst.logLevel || that.logLevel;
                args = args.slice();
                addName && (args[0] = `${name}: ${args[0]}`);
                that._log.call(that, handlerLevel, logLevel, args);
            };
            if (inst._log) {
                throw new Error(`cannot overwrite existing method: _log`);
            }
            Object.defineProperty(inst, '_log', {
                value: (...args)=> that.logger._log.apply(that.logger, args),
            });
            if (inst.logInstance) {
                throw new Error(`cannot overwrite existing method: logInstance`);
            }
            Object.defineProperty(inst, 'logInstance', {
                value: (...args)=>{
                    that.logInstance.apply(inst, args);
                },
            });
            if (inst.logLevel) {
                throw new Error(`cannot overwrite existing property: logLevel`);
            }
            Object.defineProperty(inst, "logLevel", {
                enumerable: false,
                writable: true,
                value: false, // follow Logger
            });
            if (inst.logger) {
                throw new Error(`cannot overwrite existing property: logger`);
            }
            Object.defineProperty(inst, 'logger', {
                value: that,
            });
            if (inst.log) {
                throw new Error(`cannot overwrite existing method: log()`);
            }
            Object.defineProperty(inst, 'log', {
                value: (...args)=> doLog( args, 'info'),
            });
            if (inst.info) {
                throw new Error(`cannot overwrite existing method: info()`);
            }
            Object.defineProperty(inst, 'info', {
                value: (...args)=> doLog(args, 'info'),
            });
            if (inst.debug) {
                throw new Error(`cannot overwrite existing method: debug()`);
            }
            Object.defineProperty(inst, 'debug', {
                value: (...args)=> doLog(args, 'debug'),
            });
            if (inst.warn) {
                throw new Error(`cannot overwrite existing method: warn()`);
            }
            Object.defineProperty(inst, 'warn', {
                value: (...args)=> doLog(args, 'warn'),
            });
            if (inst.error) {
                throw new Error(`cannot overwrite existing method: error()`);
            }
            Object.defineProperty(inst, 'error', {
                value: (...args)=> doLog(inst, args, 'error'),
            });
            if (inst.lastLog) {
                throw new Error(`cannot overwrite existing method: lastLog()`);
            }
            Object.defineProperty(inst, 'lastLog', {
                value: (...args)=> that.lastLog.apply(that, args),
            });
        }
    } 

    module.exports = exports.LogInstance = LogInstance;
})(typeof exports === "object" ? exports : (exports = {}));

