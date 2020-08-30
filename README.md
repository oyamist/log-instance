# log-instance
A minimalistic, extensible logging class that works on the browser or in NodeJS 
and lets you use the same Javascript code for front- or back-end.

### Installation
```
npm install --save log-instance
```
### logLevel
There are four logging levels: _debug_, _info_, _warn_ and _error_.
The logging level can be set on individual object instances or in 
the shared LogInstance.singleton.

```
var logger = LogInstance.singleton;
logger.debug("nobody hears me"); // ignored by default 'info' logLevel
logger.info("hello"); // production message (normal)
logger.warn("oops"); // production message (unusual condition)
logger.error("I died"); // production message (fatal condition)
```

### log()
A class can decorate instances with a log() method
that logs at 'info' level (i.e., "I") and automatically
includes the class name.

```
const { LogInstance } = require('log-instance');

class MyUtility {
    constructor() {
        LogInstance.singleton.logInstance(this);
        this.log('hello world!'); // (timestamp) I MyUtility: hello world!
    }
}

```

### Example
```
var myUtil = new MyUtility();
myUtil.log("hello world"); // 20200829 17:58:42 I MyUtility: hello world

logger.logLevel = "warn"; // suppress 'info' messages
myUtil.log("nobody hears me!"); // ignored
logger.info("nobody hears us!"); // ignored

myUtil.logLevel = "info"; // override logLevel for instance
myUtil.log("I hear me!"); // 20200829 17:58:42 I MyUtility: I hear me!
logger.info("we're still ignored!"); // ignored
```


