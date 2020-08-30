(function(exports) {
    var singleton;

    class LogInstance {
        constructor(opts={}) {
            this.timestampFormat = opts.timestampFormat || 'YYYYMMDD HH:mm:ss';
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
            this.logLevel = opts.logLevel || opts.level || 'info';
            this.last = {};
        }

        static get singleton() {
            singleton = singleton || new LogInstance();
            return singleton;
        }

        static logInstance(inst, opts) {
            LogInstance.singleton.logInstance(inst, opts);
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

        timestamp(now=new Date(), format=this.timestampFormat) {
            return format
                .replace(/YYYY/g, now.getUTCFullYear())
                .replace(/MM/g, `0${now.getUTCMonth()+1}`.slice(-2))
                .replace(/DD/g, `0${now.getUTCDate()}`.slice(-2))
                .replace(/HH/g, `0${now.getUTCHours()}`.slice(-2))
                .replace(/mm/g, `0${now.getUTCMinutes()}`.slice(-2))
                .replace(/ss/g, `0${now.getUTCSeconds()}`.slice(-2))
                ;
        }

        _log(handlerLevel, logLevel, args) {
            var { levels } = this;
            var handler = levels[handlerLevel];
            if (levels[logLevel].priority <= handler.priority) {
                var handlerArgs = [this.timestamp(), handler.abbreviation, ...args];
                this.last[handlerLevel] = handlerArgs;
                handler.handler.apply(undefined, handlerArgs);
            }
        }

        lastLog(level='info') {
            return (this.last[level] || []).join(' ');
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
            Object.defineProperty(inst, "logLevel", {
                enumerable: false,
                writable: true,
                value: null, // follow Logger
            });
            Object.defineProperty(inst, 'logger', {
                value: that,
            });
            Object.defineProperty(inst, 'log', {
                value: (...args)=>{
                    let name = inst.name || inst.constructor.name;
                    let logLevel = inst.logLevel || that.logLevel;
                    args = args.slice();
                    addName && (args[0] = `${name}: ${args[0]}`);
                    that._log("info", logLevel, args);
                },
            });
        }
    } 

    module.exports = exports.LogInstance = LogInstance;
})(typeof exports === "object" ? exports : (exports = {}));

