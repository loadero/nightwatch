const fs = require('fs');
const path = require('path');
const assert = require('assert');
const lodashMerge = require('lodash.merge');
const common = require('../common.js');
const Nightwatch = require('../lib/nightwatch.js');
const MockServer  = require('../lib/mockserver.js')
const Settings = common.require('settings/settings.js');
const Runner = common.require('runner/runner.js');
const Reporter = common.require('reporter/index.js');

class ExtendedReporter extends Reporter {
  registerPassed(message) {
    this.assertionMessage = message;

    super.registerPassed(message);
  }

  logAssertResult(result) {
    this.assertionResult = result;

    super.logAssertResult(result);
  }
}

class Globals {
  runGroupGlobal(client, hookName, done) {
    const groupGlobal = path.join(__dirname, './globals/', client.currentTest.group.toLowerCase() + '.js');

    fs.stat(groupGlobal, function(err, stats) {
      if (err) {
        return done();
      }

      const global = require(groupGlobal);

      if (global[hookName]) {
        global[hookName].call(global, done);
      } else {
        done();
      }
    });
  }

  beforeEach(client, done) {
    if (client.currentTest.group) {
      this.runGroupGlobal(client, 'beforeEach', done);
    } else {
      done();
    }
  }

  afterEach(client, done) {
    if (client.currentTest.group) {
      this.runGroupGlobal(client, 'afterEach', done);
    } else {
      done();
    }
  }

  protocolAfter(done) {
    this.server.close(() => done());
  }

  protocolBefore(opts = {}, done) {
    this.client = Nightwatch.createClient(opts);
    this.wdClient = Nightwatch.createClient({
      selenium: {
        version2: false,
        start_process: false
      },
      webdriver:{
        start_process: true
      }
    });

    this.client.session.sessionId = this.client.api.sessionId = '1352110219202';
    this.wdClient.session.sessionId = this.wdClient.api.sessionId = '1352110219202';

    if (typeof done == 'function') {
      this.server = MockServer.init();
      this.server.on('listening', () => done());
    }
  }

  protocolTest(definition) {
    return this.runProtocolTest(definition, this.client);
  }

  protocolTestWebdriver(definition) {
    return this.runProtocolTest(definition, this.wdClient);
  }

  runProtocolTest({assertion = function() {}, commandName, args = []}, client) {
    const originalFn = client.transport.runProtocolAction;

    return new Promise((resolve, reject) => {
      client.queue.once('queue:finished', err => {
        if (err) {
          reject(err);
        }
      });

      client.transport.runProtocolAction = function(opts) {
        try {
          opts.method = opts.method || 'GET';
          assertion(opts);

          resolve();
        } catch (err) {
          reject(err);
        }

        client.transport.runProtocolAction = originalFn;

        return Promise.resolve();
      };

      this.runApiCommand(commandName, args, client);
    });
  }

  async runProtocolTestWithError({commandName, url, message = 'test message', method, args = []}) {
    const SimplifiedReporter = common.require('reporter/simplified.js');
    class Reporter extends SimplifiedReporter {
      constructor(settings) {
        super(settings);

        this.errors = 0;
      }

      registerTestError(err) {
        this.errors++;
      }
    }

    const reporter = new Reporter({});
    const client = await Nightwatch.initClient({
      output: false,
      report_command_errors: true,
      silent: false
    }, reporter);

    MockServer.addMock({
      url,
      method,
      statusCode: 500,
      response: {
        sessionId: '1352110219202',
        state: 'unhandled error',
        value: {
          message
        },
        status: 13
      }
    }, true);

    args.push(function callback(result) {
      assert.deepStrictEqual(result, {
        code: '',
        value: {
          message,
          error: []
        },
        error: 'An unknown server-side error occurred while processing the command. – ' + message,
        errorStatus: 13,
        httpStatusCode: 500,
        state: 'unhandled error',
        status: -1
      });

      return result;
    });

    client.api[commandName](...args);

    await new Promise((resolve, reject) => {
      client.start(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    assert.strictEqual(client.reporter.errors, 1);
  }

  runApiCommand(commandName, args, client = this.client) {
    let context;
    let commandFn;
    const namespace = commandName.split('.');

    if (namespace.length === 1) {
      context = client.api;
      commandFn = context[commandName];
    } else {
      context = client.api[namespace[0]];
      if (namespace[2]) {
        context = context[namespace[1]];
        commandFn = context[namespace[2]];
      } else {
        commandFn = context[namespace[1]];
      }
    }

    return commandFn.apply(client.api, args);
  }

  startTestRunner(testsPath, suppliedSettings) {
    let settings = Settings.parse(suppliedSettings);
    let runner = Runner.create(settings, {
      reporter: 'junit'
    });

    if (!Array.isArray(testsPath)) {
      testsPath = [testsPath];
    }

    return Runner
      .readTestSource(settings, {
        _source: testsPath
      })
      .then(modules => {
        return runner.run(modules);
      })
      .then(_ => {
        return runner;
      });
  }

  createReporter() {
    const reporter = new ExtendedReporter({
      settings: this.client.settings
    });

    this.client.setReporter(reporter);
  }
}

module.exports = new Globals();
function addSettings(settings) {
  return lodashMerge({
    globals: {
      retryAssertionTimeout: 5,
      waitForConditionPollInterval: 3
    },
    output: false,
    silent: false
  }, settings);
}

module.exports.assertion = function(assertionName, api, {
  args = [],
  commandResult = {},
  assertArgs = false,
  assertError = false,
  assertMessage = false,
  assertFailure = false,
  assertResult = false,
  negate = false,
  assertApiCommandArgs,
  assertion = function() {},
  settings = {}
}) {
  return new Promise((resolve, reject) => {
    // initialize
    const instance = new Globals();
    const options = addSettings(settings);
    instance.protocolBefore(options);

    let context;
    let queueOpts;

    // add API command
    if (api) {
      instance.client.api[api] = function(...fnArgs) {
        if (assertArgs) {
          if (typeof args[0] == 'string') {
            assert.strictEqual(fnArgs[0], args[0]);
          } else {
            assert.deepStrictEqual(fnArgs[0], args[0]);
          }

          if (fnArgs.length > 2) {
            assert.strictEqual(fnArgs[1], args[1]);
          }
        } else if (assertApiCommandArgs) {
          assertApiCommandArgs(fnArgs);
        }

        const callback = fnArgs[fnArgs.length - 1];
        callback(typeof commandResult == 'function' ? commandResult() : commandResult);
      };
    }

    // intercept add to queue and store the context and options
    const {client} = instance;
    const addToQueue = client.queue.add;
    client.queue.add = function(opts) {
      context = opts.context;
      queueOpts = opts.options;
      addToQueue.call(this, opts);
    };

    // create an extended reporter so we can intercept the results
    instance.createReporter();

    // when the queue has finished running, signal the end of the test
    client.queue.once('queue:finished', err => {
      if (err && err.name !== 'NightwatchAssertError') {
        reject(err);

        return;
      }

      try {
        // Run common assertions
        if (assertError) {
          assert.ok(err instanceof Error);
          assert.strictEqual(err.name, 'NightwatchAssertError');
        }

        const assertionInstance = context.instance;
        const {reporter} = client;

        if (assertArgs) {
          assert.deepStrictEqual(assertionInstance.args, args);
          assert.deepStrictEqual(assertionInstance.retryAssertionTimeout, undefined);
          assert.deepStrictEqual(assertionInstance.rescheduleInterval, undefined);
        }

        if (assertFailure) {
          assert.strictEqual(assertionInstance.hasFailure(), true);
          assert.strictEqual(assertionInstance.isOk(assertionInstance.getValue()), false);
        }

        if (assertMessage) {
          const message = args[args.length - 1];
          assert.strictEqual(assertionInstance.message, message);
          assert.ok(typeof reporter.assertionMessage != 'undefined', 'assertionMessage is undefined');
          assert.ok(reporter.assertionMessage.startsWith(message), reporter.assertionMessage);
        }

        if (assertResult) {
          assert.deepStrictEqual(assertionInstance.result, commandResult);
        }

        const {failure, message} = client.reporter.assertionResult;
        assertion({reporter, instance: assertionInstance, err, queueOpts, failure, message});

        resolve();
      } catch (ex) {
        reject(ex);
      }
    });

    // run the assertion
    const negateStr = negate ? 'not.' : '';
    instance.runApiCommand(`assert.${negateStr}${assertionName}`, args);
  });

};
