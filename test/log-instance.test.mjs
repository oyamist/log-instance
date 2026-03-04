import { describe, it, expect } from '@sc-voice/vitest';
import {
  LogInstance,
  logger,
  terseLogger,
} from '../index.mjs';

describe("log-instance", function() {

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
        expect(logger.logLevel).toBe('info');
        expect(logger.name).toBe('LogInstance');
        expect(logger.levels.debug.handler).toBe(console.debug);
        expect(logger.levels.info.handler).toBe(console.log);
        expect(logger.levels.warn.handler).toBe(console.warn);
        expect(logger.levels.error.handler).toBe(console.error);
    });
    it("custom ctor", ()=>{
        var timestampFormat = '';
        var testLogger = new LogInstance({
            name: "TestLogger",
            logLevel: "warn",
            levelFormat: "full",
            timestampFormat,
        });
        expect(testLogger.name).toBe('TestLogger');
        expect(testLogger.logLevel).toBe('warn');
        expect(testLogger.levelAbbreviation('debug')).toBe('DEBUG');
        expect(testLogger.levelAbbreviation('info')).toBe('INFO');
        expect(testLogger.levelAbbreviation('warn')).toBe('WARN');
        expect(testLogger.levelAbbreviation('error')).toBe('ERROR');
        expect(testLogger.timestampFormat).toBe('');

        // auto level format
        var testLogger = new LogInstance({
            name: "TestLogger",
            levelFormat: "auto", // default
        });
        expect(testLogger.levelAbbreviation('debug')).toBe('D');
        expect(testLogger.levelAbbreviation('info')).toBe('I');
        expect(testLogger.levelAbbreviation('warn')).toBe('WARN');
        expect(testLogger.levelAbbreviation('error')).toBe('ERROR');

        // none level format
        var testLogger = new LogInstance({
            name: "TestLogger",
            levelFormat: "none",
        });
        expect(testLogger.levelAbbreviation('debug')).toBe('');
        expect(testLogger.levelAbbreviation('info')).toBe('');
        expect(testLogger.levelAbbreviation('warn')).toBe('');
        expect(testLogger.levelAbbreviation('error')).toBe('');

        // compact level format
        var testLogger = new LogInstance({
            name: "TestLogger",
            levelFormat: "compact",
        });
        expect(testLogger.levelAbbreviation('debug')).toBe('D');
        expect(testLogger.levelAbbreviation('info')).toBe('I');
        expect(testLogger.levelAbbreviation('warn')).toBe('W');
        expect(testLogger.levelAbbreviation('error')).toBe('E');
    });
    it("logger is singleton", ()=>{
        expect(logger).toBe(LogInstance.singleton);
    });
    it("TESTTESTerror throws", ()=>{
      let koala = new Koala();
      let errCode = "E_TEST";
      var eCaught;
      console.warn("-------------------EXPECTED ERROR (BEGIN)-------------------");
      try {
        throw koala.error(errCode, 'error test');
      } catch(e) { eCaught = e; }
      expect(eCaught.message).toBe(errCode);

      eCaught = undefined;
      try {
        throw logger.error(errCode, 'error test');
      } catch(e) { eCaught = e; }
      expect(eCaught.message).toBe(errCode);
      console.warn("-------------------EXPECTED ERROR (END)-------------------");
    });
    it("testLogger is terseSingleton", ()=>{
        expect(terseLogger).toBe(LogInstance.terseSingleton);
        expect(terseLogger.timestampFormat).toBe('');
        expect(terseLogger.levelFormat).toBe(0);
    });
    it("logInstance(obj) won't override existing methods/properties", ()=>{
        expect(()=> {
            LogInstance.logInstance({logLevel:'my-level'});
        }).toThrow();
        expect(()=> {
            LogInstance.logInstance({log:()=>'my-method'});
        }).toThrow();
        expect(()=> {
            LogInstance.logInstance({debug:()=>'my-method'});
        }).toThrow();
        expect(()=> {
            LogInstance.logInstance({warn:()=>'my-method'});
        }).toThrow();
        expect(()=> {
            LogInstance.logInstance({error:()=>'my-method'});
        }).toThrow();
        expect(()=> {
            LogInstance.logInstance({info:()=>'my-method'});
        }).toThrow();
        expect(()=> {
            LogInstance.logInstance({logInstance:()=>'my-method'});
        }).toThrow();
    });
    it("logInstance(obj) decorates object", ()=>{

        // Decorate object with logger methods and properties
        var obj1 = {name:"aThing1"};
        logger.logInstance(obj1);
        expect(obj1.logger).toBe(logger);
        expect(obj1.logLevel).toBe(false);
        var msg = "info-text";
        obj1.info(msg);
        expect(logger.lastLog()).toMatch(new RegExp(msg));

        // new properties are not enumerable
        var noEnum = ["log","debug","warn","error","logInstance"];
        expect(Object.keys(obj1).some(k=>noEnum.includes(k)))
            .toBe(false);

        // Decorate with options
        var obj2 = {name:"aThing2"};
        logger.logInstance(obj2, {
            logLevel: 'warn',
        });
        expect(obj2.logger).toBe(logger);
        expect(obj2.logLevel).toBe('warn');

    });
    it("timestamp(...) => timestamp", ()=>{
        var now = new Date(Date.UTC(2020,0,31,13,22,33));
        var logger = LogInstance.singleton;
        expect(LogInstance.timestamp(now, logger.timestampFormat))
            .toBe("20200131 13:22:33");
        expect(LogInstance.timestamp(now, "YYYY-MM-DD HHmmss"))
            .toBe("2020-01-31 132233");
    });
    it("lastLog(level) => most recent log", ()=>{
        var logger = new LogInstance();
        logger.info("info message");
        logger.warn("warn message");
        expect(logger.lastLog()).toMatch(/ I info message/);
        expect(logger.lastLog("warn")).toMatch(/ WARN warn message/);
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
        expect(aLogger.lastLog('debug')).toBe('');
        expect(aLogger.lastLog('info')).toBe('');
        expect(aLogger.lastLog('warn')).toBe('');
        expect(aLogger.lastLog('error')).toBe('');

        // error level
        console.warn('-------------------EXPECTED ERROR (BEGIN) ------------------');
        eCaught = undefined;
        aLogger.logLevel = "error";
        aLogger.debug('debug.error');
        aLogger.info('info.error');
        try { throw aLogger.error('error.error'); } catch(e) {eCaught = e}
        expect(eCaught.message).toBe('error.error');
        expect(aLogger.lastLog('debug')).toBe('');
        expect(aLogger.lastLog('info')).toBe('');
        expect(aLogger.lastLog('error')).toMatch(/error.error/);

        // info level
        eCaught = undefined;
        aLogger.logLevel = "info";
        aLogger.debug('debug.info');
        aLogger.info('info.info');
        try { throw aLogger.error('error.info'); } catch(e) {eCaught = e}
        expect(eCaught.message).toBe('error.info');
        expect(aLogger.lastLog('debug')).toBe('');
        expect(aLogger.lastLog('info')).toMatch(/info.info/);
        expect(aLogger.lastLog('error')).toMatch(/error.info/);

        // debug level
        eCaught = undefined;
        aLogger.logLevel = "debug";
        aLogger.debug('debug.debug');
        aLogger.info('info.debug');
        try { throw aLogger.error('error.debug'); } catch(e) {eCaught = e}
        expect(eCaught.message).toBe('error.debug');
        expect(aLogger.lastLog('debug')).toMatch(/ D debug.debug/);
        expect(aLogger.lastLog('info')).toMatch(/ I info.debug/);
        expect(aLogger.lastLog('error')).toMatch(/ ERROR error.debug/);

        // any level
        eCaught = undefined;
        aLogger.logLevel = "any";
        aLogger.debug('debug.any');
        aLogger.info('info.any');
        try { throw aLogger.error('error.any'); } catch(e) {eCaught = e}
        expect(eCaught.message).toBe('error.any');
        expect(aLogger.lastLog('debug')).toMatch(/ D debug.any/);
        expect(aLogger.lastLog('info')).toMatch(/ I info.any/);
        expect(aLogger.lastLog('error')).toMatch(/ ERROR error.any/);
        console.warn('-------------------EXPECTED ERROR (END) ------------------');
    });
    it("example",()=>{
        var thing = new Koala();
        expect(thing.logger).toBe(logger);
        expect(thing.logLevel).toBe(false); // defer to logger for logLevel

        // The instance log() method logs at info level
        // and includes the class name
        thing.log("hello world");
        var lastLog = logger.lastLog();
        expect(lastLog).toMatch(/Koala: hello world/);

        // Increasing the logger logLevel suppresses log()
        logger.logLevel = 'warn';
        thing.log("Nobody listens to me");
        expect(logger.lastLog()).toBe(lastLog); // unchanged


        // The instance log() method can be enabled
        thing.logLevel = 'info';
        thing.log("hear me now");
        var lastLog = logger.lastLog();
        expect(lastLog).toMatch(/Koala: hear me now/);

        // but the logger.info() method is muted.
        logger.info("but we aren't heard");
        expect(logger.lastLog()).toBe(lastLog); // unchanged
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
        expect(eCaught.message).toBe('invalid logLevel:"bad"');

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
        expect(eCaught.message).toBe('Invalid logLevel:bad');
    });
    it("logInstance() cannot overwrite methods",()=>{
        var badObj = {logger: "anything"};
        var eCaught;
        try {
            logger.logInstance(badObj);
        } catch(e) {
            eCaught = e;
        }
        expect(eCaught.message).toMatch(/cannot override: logger/);
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
        expect(testLogger.logger).toBe(testLogger);
        expect(aObj.logger).toBe(testLogger);
        expect(bObj.logger).toBe(aObj);
        expect(cObj.logger).toBe(bObj);
        expect(dObj.logger).toBe(cObj);
        expect(testLogger.logLevel).toBe('none');
        expect(aObj.logLevel).toBe(false); // follows testLogger
        expect(bObj.logLevel).toBe(false); // follows aObj
        expect(cObj.logLevel).toBe(false); // follows bObj
        expect(dObj.logLevel).toBe(false); // follows cObj
        testLogger.log("ignore testLogger");
        aObj.log("ignore A");
        bObj.log("ignore B");
        cObj.log("ignore C");
        dObj.log("ignore D");
        expect(testLogger.lastLog()).toBe('');

        // Enable logging for B, C and D
        bObj.logLevel = 'info';  // override
        testLogger.log("ignore testLogger");
        expect(testLogger.lastLog()).toBe('');
        aObj.log("Hi, I'm A");
        expect(testLogger.lastLog()).toBe('');
        bObj.log("Hi, I'm B");  // direct logLevel
        expect(testLogger.lastLog()).toMatch(/I B: Hi, I'm B/);
        cObj.log("Hi, I'm C");  // indirect logLevel
        expect(testLogger.lastLog()).toMatch(/I C: Hi, I'm C/);
        dObj.log("Hi, I'm D");  // indirect logLevel
        expect(testLogger.lastLog()).toMatch(/I D: Hi, I'm D/);
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
        expect(testLogger.lastLog()).toBe('obj1: obj1-log');

        var obj2 = {name:"obj2"};
        obj1.logInstance(obj2);
        obj2.log("obj2-log");
        expect(testLogger.lastLog()).toBe('obj2: obj2-log');

        testLogger.log("test simple");
        expect(testLogger.lastLog()).toBe('test simple');
    });
});
