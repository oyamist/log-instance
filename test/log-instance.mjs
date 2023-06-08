import should from 'should';
import {
  LogInstance,
  logger,
  terseLogger,
} from '../index.mjs';

(typeof describe === 'function') && describe("log-instance", function() {

    class Animal {
        constructor(opts={}) {
            var logger = opts.logger || LogInstance.singleton;
            logger.logInstance(this);
        }
    }

    class Koala extends Animal {
        constructor(opts={}){
            super(opts);
        }
    }

    it("default ctor", ()=>{
        var logger = new LogInstance();
        should(logger.logLevel).equal('info');
        should(logger.name).equal('LogInstance');
        should(logger.levels.debug.handler).equal(console.debug);
        should(logger.levels.info.handler).equal(console.log);
        should(logger.levels.warn.handler).equal(console.warn);
        should(logger.levels.error.handler).equal(console.error);
    });
    it("custom ctor", ()=>{
        var timestampFormat = '';
        var testLogger = new LogInstance({
            name: "TestLogger",
            logLevel: "warn",
            levelFormat: "full",
            timestampFormat,
        });
        should(testLogger.name).equal('TestLogger');
        should(testLogger.logLevel).equal('warn');
        should(testLogger.levelAbbreviation('debug')).equal('DEBUG');
        should(testLogger.levelAbbreviation('info')).equal('INFO');
        should(testLogger.levelAbbreviation('warn')).equal('WARN');
        should(testLogger.levelAbbreviation('error')).equal('ERROR');
        should(testLogger.timestampFormat).equal('');

        // auto level format
        var testLogger = new LogInstance({
            name: "TestLogger",
            levelFormat: "auto", // default
        });
        should(testLogger.levelAbbreviation('debug')).equal('D');
        should(testLogger.levelAbbreviation('info')).equal('I');
        should(testLogger.levelAbbreviation('warn')).equal('WARN');
        should(testLogger.levelAbbreviation('error')).equal('ERROR');

        // none level format
        var testLogger = new LogInstance({
            name: "TestLogger",
            levelFormat: "none",
        });
        should(testLogger.levelAbbreviation('debug')).equal('');
        should(testLogger.levelAbbreviation('info')).equal('');
        should(testLogger.levelAbbreviation('warn')).equal('');
        should(testLogger.levelAbbreviation('error')).equal('');

        // compact level format
        var testLogger = new LogInstance({
            name: "TestLogger",
            levelFormat: "compact",
        });
        should(testLogger.levelAbbreviation('debug')).equal('D');
        should(testLogger.levelAbbreviation('info')).equal('I');
        should(testLogger.levelAbbreviation('warn')).equal('W');
        should(testLogger.levelAbbreviation('error')).equal('E');
    });
    it("logger is singleton", ()=>{
        should(logger).equal(LogInstance.singleton);
    });
    it("TESTTESTerror throws", ()=>{
      let koala = new Koala();
      let errCode = "E_TEST";
      var eCaught;
      console.warn("-------------------EXPECTED ERROR (BEGIN)-------------------");
      try {
        throw koala.error(errCode, 'error test');
      } catch(e) { eCaught = e; }
      should(eCaught.message).equal(errCode);

      eCaught = undefined;
      try {
        throw logger.error(errCode, 'error test');
      } catch(e) { eCaught = e; }
      should(eCaught.message).equal(errCode);
      console.warn("-------------------EXPECTED ERROR (END)-------------------");
    });
    it("testLogger is terseSingleton", ()=>{
        should(terseLogger).equal(LogInstance.terseSingleton);
        should(terseLogger.timestampFormat).equal('');
        should(terseLogger.levelFormat).equal(0);
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
        var logger = new LogInstance();
        logger.info("info message");
        logger.warn("warn message");
        should(logger.lastLog()).match(/ I info message/);
        should(logger.lastLog("warn")).match(/ WARN warn message/);
    });
    it("TESTTESTlogLevel controls logging", ()=>{
        var eCaught;
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
        console.warn('-------------------EXPECTED ERROR (BEGIN) ------------------');
        eCaught = undefined;
        aLogger.logLevel = "error";
        aLogger.debug('debug.error');
        aLogger.info('info.error');
        try { throw aLogger.error('error.error'); } catch(e) {eCaught = e}
        should(eCaught.message).equal('error.error');
        should(aLogger.lastLog('debug')).equal('');
        should(aLogger.lastLog('info')).equal('');
        should(aLogger.lastLog('error')).match(/error.error/);

        // info level
        eCaught = undefined;
        aLogger.logLevel = "info";
        aLogger.debug('debug.info');
        aLogger.info('info.info');
        try { throw aLogger.error('error.info'); } catch(e) {eCaught = e}
        should(eCaught.message).equal('error.info');
        should(aLogger.lastLog('debug')).equal('');
        should(aLogger.lastLog('info')).match(/info.info/);
        should(aLogger.lastLog('error')).match(/error.info/);

        // debug level
        eCaught = undefined;
        aLogger.logLevel = "debug";
        aLogger.debug('debug.debug');
        aLogger.info('info.debug');
        try { throw aLogger.error('error.debug'); } catch(e) {eCaught = e}
        should(eCaught.message).equal('error.debug');
        should(aLogger.lastLog('debug')).match(/ D debug.debug/);
        should(aLogger.lastLog('info')).match(/ I info.debug/);
        should(aLogger.lastLog('error')).match(/ ERROR error.debug/);

        // any level
        eCaught = undefined;
        aLogger.logLevel = "any";
        aLogger.debug('debug.any');
        aLogger.info('info.any');
        try { throw aLogger.error('error.any'); } catch(e) {eCaught = e}
        should(eCaught.message).equal('error.any');
        should(aLogger.lastLog('debug')).match(/ D debug.any/);
        should(aLogger.lastLog('info')).match(/ I info.any/);
        should(aLogger.lastLog('error')).match(/ ERROR error.any/);
        console.warn('-------------------EXPECTED ERROR (END) ------------------');
    });
    it("example",()=>{
        var thing = new Koala();
        should(thing.logger).equal(logger);
        should(thing.logLevel).equal(false); // defer to logger for logLevel

        // The instance log() method logs at info level
        // and includes the class name
        thing.log("hello world"); 
        var lastLog = logger.lastLog();
        should(lastLog).match(/Koala: hello world/);

        // Increasing the logger logLevel suppresses log()
        logger.logLevel = 'warn';
        thing.log("Nobody listens to me"); 
        should(logger.lastLog()).equal(lastLog); // unchanged


        // The instance log() method can be enabled
        thing.logLevel = 'info';
        thing.log("hear me now"); 
        var lastLog = logger.lastLog();
        should(lastLog).match(/Koala: hear me now/);

        // but the logger.info() method is muted.
        logger.info("but we aren't heard");
        should(logger.lastLog()).equal(lastLog); // unchanged
    });
    it("logLevel() must be valid",()=>{
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
    it("logInstance() cannot overwrite methods",()=>{
        var badObj = {logger: "anything"};
        var eCaught;
        try {
            logger.logInstance(badObj);
        } catch(e) {
            eCaught = e;
        }
        should(eCaught.message).match(/cannot override: logger/);
    });
    it("logInstance() creates a logger",()=>{
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
    it("suppress level and timestamp",()=>{
        var testLogger = new LogInstance({
            name: "TestLogger",
        });
        testLogger.timestampFormat = "";
        testLogger.levelFormat = "none";
        var obj1 = {name:"obj1"};
        testLogger.logInstance(obj1);
        obj1.log("obj1-log");
        should(testLogger.lastLog()).equal('obj1: obj1-log');

        var obj2 = {name:"obj2"};
        obj1.logInstance(obj2);
        obj2.log("obj2-log");
        should(testLogger.lastLog()).equal('obj2: obj2-log');

        testLogger.log("test simple");
        should(testLogger.lastLog()).equal('test simple');
    });
})
