(typeof describe === 'function') && describe("log-instance", function() {
    const should = require('should');
    const {
        LogInstance,
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
    });
    it("logInstance(obj) decorates object", ()=>{
        var obj = {};
        var logger = new LogInstance();

        // Decorate object with logger and  log() method 
        logger.logInstance(obj);
        should(obj.logger).equal(logger);
        obj.log('info-text');
        var timestamp = logger.last.info[0];
        should.deepEqual(logger.last.info, [
            timestamp, 'I', 'Object: info-text' ]);

        // new properties are not enumerable
        should.deepEqual(Object.keys(obj), []);
    });
    it("TESTTESTtimestamp(...) => timestamp", ()=>{
        var now = new Date(Date.UTC(2020,0,31,13,22,33));
        var logger = LogInstance.singleton;
        should(logger.timestamp(now))
            .equal("20200131 13:22:33");
        should(logger.timestamp(now, "YYYY-MM-DD HHmmss"))
            .equal("2020-01-31 132233");
    });
    it("TESTTESTlastLog(level) => most recent log", ()=>{
        var logger = LogInstance.singleton;
        logger.info("info message");
        logger.warn("warn message");
        should(logger.lastLog()).match(/ I info message/);
        should(logger.lastLog("warn")).match(/ WARN warn message/);
    });
    it("logLevel controls logging", ()=>{
        var logger = new LogInstance({
            logLevel: "none",
        });

        // No logging
        logger.debug('text.none');
        logger.info('text.none');
        logger.warn('text.none');
        logger.error('text.none');
        should(logger.last.debug).equal(undefined);
        should(logger.last.info).equal(undefined);
        should(logger.lastWarn).equal(undefined);
        should(logger.last.error).equal(undefined);

        // error level
        logger.logLevel = "error";
        logger.debug('debug.error');
        logger.info('info.error');
        logger.error('error.error');
        should(logger.last.debug).equal(undefined);
        should(logger.last.info).equal(undefined);
        should(logger.last.error.slice(-1)[0]).equal('error.error');

        // info level
        logger.logLevel = "info";
        logger.debug('debug.info');
        logger.info('info.info');
        logger.error('error.info');
        should(logger.last.debug).equal(undefined);
        should(logger.last.info.slice(-1)[0]).equal('info.info');
        should(logger.last.error.slice(-1)[0]).equal('error.info');

        // debug level
        logger.logLevel = "debug";
        logger.debug('debug.debug');
        logger.info('info.debug');
        logger.error('error.debug');
        should(logger.last.debug.slice(-1)[0]).equal('debug.debug');
        should(logger.last.info.slice(-1)[0]).equal('info.debug');
        should(logger.last.error.slice(-1)[0]).equal('error.debug');

        // any level
        logger.logLevel = "any";
        logger.debug('debug.any');
        logger.info('info.any');
        logger.error('error.any');
        should(logger.last.debug.slice(-1)[0]).equal('debug.any');
        should(logger.last.info.slice(-1)[0]).equal('info.any');
        should(logger.last.error.slice(-1)[0]).equal('error.any');
    });
    it("TESTTESTexample",()=>{
        var logger = LogInstance.singleton;

        var myUtil = new MyUtility();
        should(myUtil.logger).equal(logger);
        should(myUtil.logLevel).equal(null); // defer to logger for logLevel

        // The instance log() method logs at info level
        // and includes the class name
        myUtil.log("hello world"); 
        should(myUtil.logger.last.info.slice().pop())
            .equal("MyUtility: hello world");

        // Increasing the logger logLevel suppresses log()
        logger.logLevel = 'warn';
        myUtil.log("Nobody listens to me"); 
        should(myUtil.logger.last.info.slice().pop())
            .equal("MyUtility: hello world"); // unchanged


        // The instance log() method can be enabled
        myUtil.logLevel = 'info';
        myUtil.log("hear me now"); 
        should(myUtil.logger.last.info.slice().pop())
            .equal("MyUtility: hear me now");

        // but the logger.info() method is muted.
        logger.info("but we aren't heard");
        should(myUtil.logger.last.info.slice().pop())
            .equal("MyUtility: hear me now"); // unchanged
    });
})
