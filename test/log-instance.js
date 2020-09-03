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
    it("TESTTESTlogInstance(obj) decorates object", ()=>{

        // Decorate object with logger methods and properties
        var obj1 = {name:"aThing1"};
        logger.logInstance(obj1);
        should(obj1.logger).equal(logger);
        should(obj1.logLevel).equal(false);
        var msg = "info-text";
        obj1.info(msg);
        should(logger.lastLog()).match(new RegExp(msg));

        // new properties are not enumerable
        var noEnum = ["log","debug","warn","error","logInstance"];
        should(Object.keys(obj1).some(k=>noEnum.includes(k)))
            .equal(false);

        // Decorate with options
        var obj2 = {name:"aThing2"};
        logger.logInstance(obj2, {
            logLevel: 'warn',
        });
        should(obj2.logger).equal(logger);
        should(obj2.logLevel).equal('warn');

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
    it("TESTTESTlogLevel() must be valid",()=>{
        // LogInstance error handling
        var eCaught;
        var testLogger = new LogInstance();
        try {
            testLogger.logLevel = "bad";
        } catch(e) {
            eCaught = e;
        }
        should(eCaught.message).equal('invalid logLevel:"bad"');

        // created logger error handling
        eCaught = undefined;
        var aObj = {name:"a"};
        logger.logInstance(aObj);
        aObj.logLevel = "bad";
        try {
            aObj.log("hello");
        } catch(e) {
            eCaught = e;
        }
        should(eCaught.message).equal('Invalid logLevel:bad');
    });
    it("TESTTESTlogInstance() cannot overwrite methods",()=>{
        var badObj = {logger: "anything"};
        var eCaught;
        try {
            logger.logInstance(badObj);
        } catch(e) {
            eCaught = e;
        }
        should(eCaught.message).match(/cannot override: logger/);
    });
    it("TESTTESTlogInstance() creates a logger",()=>{
        var aObj = {name: "A"};
        var bObj = {name: "B"};
        var cObj = {name: "C"};
        var dObj = {name: "D"};
        var testLogger = new LogInstance({
            name: "TestLogger",
            logLevel: "none", // disable all logging
        });

        // All logging disabled
        testLogger.logInstance(aObj);
        aObj.logInstance(bObj);
        bObj.logInstance(cObj);
        cObj.logInstance(dObj);
        should(testLogger.logger).equal(testLogger);
        should(aObj.logger).equal(testLogger);
        should(bObj.logger).equal(aObj);
        should(cObj.logger).equal(bObj);
        should(dObj.logger).equal(cObj);
        should(testLogger.logLevel).equal('none');
        should(aObj.logLevel).equal(false); // follows testLogger
        should(bObj.logLevel).equal(false); // follows aObj
        should(cObj.logLevel).equal(false); // follows bObj
        should(dObj.logLevel).equal(false); // follows cObj
        testLogger.log("ignore testLogger");
        aObj.log("ignore A"); 
        bObj.log("ignore B"); 
        cObj.log("ignore C"); 
        dObj.log("ignore D"); 
        should(testLogger.lastLog()).equal('');

        // Enable logging for B, C and D
        bObj.logLevel = 'info';  // override
        testLogger.log("ignore testLogger");
        should(testLogger.lastLog()).equal('');
        aObj.log("Hi, I'm A"); 
        should(testLogger.lastLog()).equal('');
        bObj.log("Hi, I'm B");  // direct logLevel
        should(testLogger.lastLog()).match(/I B: Hi, I'm B/);
        cObj.log("Hi, I'm C");  // indirect logLevel
        should(testLogger.lastLog()).match(/I C: Hi, I'm C/);
        dObj.log("Hi, I'm D");  // indirect logLevel 
        should(testLogger.lastLog()).match(/I D: Hi, I'm D/);
    });
})
