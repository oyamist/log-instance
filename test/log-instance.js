(typeof describe === 'function') && describe("log-instance", function() {
    const should = require('should');
    const {
        LogInstance,
        logger,
    } = require('../index');

    class MyUtility {
        constructor(opts={}) {
            var logger = opts.logger || LogInstance.singleton;
            logger.logInstance(this);
        }
    }

    it("default ctor", ()=>{
        var logger = new LogInstance();
        should(logger.logLevel).equal('info');
        should(logger.name).equal('LogInstance');
    });
    it("custom ctor", ()=>{
        var logger = new LogInstance({
            name: "TestLogger",
            logLevel: "warn",
        });
        should(logger.name).equal('TestLogger');
        should(logger.logLevel).equal('warn');
    });
    it("logger is singleton", ()=>{
        should(logger).equal(LogInstance.singleton);
    });
    it("logInstance(obj) won't override existing methods/properties", ()=>{
        should.throws(()=> {
            LogInstance.logInstance({logLevel:'my-level'});
        });
        should.throws(()=> {
            LogInstance.logInstance({log:()=>'my-method'});
        });
        should.throws(()=> {
            LogInstance.logInstance({debug:()=>'my-method'});
        });
        should.throws(()=> {
            LogInstance.logInstance({warn:()=>'my-method'});
        });
        should.throws(()=> {
            LogInstance.logInstance({error:()=>'my-method'});
        });
        should.throws(()=> {
            LogInstance.logInstance({info:()=>'my-method'});
        });
        should.throws(()=> {
            LogInstance.logInstance({logInstance:()=>'my-method'});
        });
    });
    it("logInstance(obj) decorates object", ()=>{
        var obj = {name:"aThing"};

        // Decorate object with logger methods and properties
        logger.logInstance(obj);
        should(obj.logger).equal(logger);
        should(obj.logLevel).equal(false);
        var msg = "info-text";
        obj.info(msg);
        should(logger.lastLog()).match(new RegExp(msg));

        // new properties are not enumerable
        var noEnum = ["log","debug","warn","error","logInstance"];
        should(Object.keys(obj).some(k=>noEnum.includes(k)))
            .equal(false);
    });
    it("timestamp(...) => timestamp", ()=>{
        var now = new Date(Date.UTC(2020,0,31,13,22,33));
        var logger = LogInstance.singleton;
        should(LogInstance.timestamp(now, logger.timestampFormat))
            .equal("20200131 13:22:33");
        should(LogInstance.timestamp(now, "YYYY-MM-DD HHmmss"))
            .equal("2020-01-31 132233");
    });
    it("lastLog(level) => most recent log", ()=>{
        var logger = LogInstance.singleton;
        logger.info("info message");
        logger.warn("warn message");
        should(logger.lastLog()).match(/ I info message/);
        should(logger.lastLog("warn")).match(/ WARN warn message/);
    });
    it("logLevel controls logging", ()=>{
        var aLogger = new LogInstance({
            logLevel: 'none',
        });
        // No logging
        aLogger.logLevel = "none";
        aLogger.debug('text.none');
        aLogger.info('text.none');
        aLogger.warn('text.none');
        aLogger.error('text.none');
        should(aLogger.lastLog('debug')).equal('');
        should(aLogger.lastLog('info')).equal('');
        should(aLogger.lastLog('warn')).equal('');
        should(aLogger.lastLog('error')).equal('');

        // error level
        aLogger.logLevel = "error";
        aLogger.debug('debug.error');
        aLogger.info('info.error');
        aLogger.error('error.error');
        should(aLogger.lastLog('debug')).equal('');
        should(aLogger.lastLog('info')).equal('');
        should(aLogger.lastLog('error')).match(/error.error/);

        // info level
        aLogger.logLevel = "info";
        aLogger.debug('debug.info');
        aLogger.info('info.info');
        aLogger.error('error.info');
        should(aLogger.lastLog('debug')).equal('');
        should(aLogger.lastLog('info')).match(/info.info/);
        should(aLogger.lastLog('error')).match(/error.info/);

        // debug level
        aLogger.logLevel = "debug";
        aLogger.debug('debug.debug');
        aLogger.info('info.debug');
        aLogger.error('error.debug');
        should(aLogger.lastLog('debug')).match(/ D debug.debug/);
        should(aLogger.lastLog('info')).match(/ I info.debug/);
        should(aLogger.lastLog('error')).match(/ ERROR error.debug/);

        // any level
        aLogger.logLevel = "any";
        aLogger.debug('debug.any');
        aLogger.info('info.any');
        aLogger.error('error.any');
        should(aLogger.lastLog('debug')).match(/ D debug.any/);
        should(aLogger.lastLog('info')).match(/ I info.any/);
        should(aLogger.lastLog('error')).match(/ ERROR error.any/);
    });
    it("example",()=>{
        var myUtil = new MyUtility();
        should(myUtil.logger).equal(logger);
        should(myUtil.logLevel).equal(false); // defer to logger for logLevel

        // The instance log() method logs at info level
        // and includes the class name
        myUtil.log("hello world"); 
        var lastLog = logger.lastLog();
        should(lastLog).match(/MyUtility: hello world/);

        // Increasing the logger logLevel suppresses log()
        logger.logLevel = 'warn';
        myUtil.log("Nobody listens to me"); 
        should(logger.lastLog()).equal(lastLog); // unchanged


        // The instance log() method can be enabled
        myUtil.logLevel = 'info';
        myUtil.log("hear me now"); 
        var lastLog = logger.lastLog();
        should(lastLog).match(/MyUtility: hear me now/);

        // but the logger.info() method is muted.
        logger.info("but we aren't heard");
        should(logger.lastLog()).equal(lastLog); // unchanged
    });
    it("TESTTESTlogInstance() creates a logger",()=>{
        var aObj = {name: "A"};
        var bObj = {name: "B"};
        var aLogger = new LogInstance({
            name: "TestLogger",
            logLevel: "none", // disable all logging
        });

        // The shared logger ignores 'info'

        // Make aObj into a logger of TestLogger
        aLogger.logInstance(aObj);
        should(aObj.logger).equal(aLogger);
        aObj.logLevel = 'info';  // override
        aObj.log("Hi, I'm A"); 
        should(aLogger.lastLog()).match(/Hi, I'm A/);
        should(aObj.lastLog()).equal(aLogger.lastLog());
        aLogger.info("Hi, I'm TestLogger"); // still ignored
        should(aLogger.lastLog()).match(/Hi, I'm A/);

        // Make bObj into a logger of aObj
        aObj.logInstance(bObj);
        should(bObj.logger).equal(aObj);
        should(bObj.logLevel).equal(false); // follow aObj logLevel
        should(bObj.lastLog()).match(/Hi, I'm A/);
        bObj.log("Hi, I'm B");
        should(aLogger.lastLog()).match(/Hi, I'm B/);
    });
})
