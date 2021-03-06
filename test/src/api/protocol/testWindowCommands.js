const assert = require('assert');
const Globals = require('../../../lib/globals.js');

describe('window commands', function() {
  before(function(done) {
    Globals.protocolBefore({}, done);
  });

  after(function(done) {
    Globals.protocolAfter(done);
  });

  it('test .windowHandle()', function() {
    return Globals.protocolTest({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'GET');
        assert.strictEqual(opts.path, '/session/1352110219202/window_handle');
      },
      commandName: 'windowHandle',
      args: []
    });
  });

  it('test .windowHandles()', function() {
    return Globals.protocolTest({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'GET');
        assert.strictEqual(opts.path, '/session/1352110219202/window_handles');
      },
      commandName: 'windowHandles',
      args: []
    });
  });

  it('testCloseWindow', function() {
    return Globals.protocolTest({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'DELETE');
        assert.strictEqual(opts.path, '/session/1352110219202/window');
      },
      commandName: 'window',
      args: ['DELETE']
    });
  });

  it('testSwitchWindow', function() {
    return Globals.protocolTest({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'POST');
        assert.strictEqual(opts.path, '/session/1352110219202/window');
        assert.deepStrictEqual(opts.data, {name: 'other-window'});
      },
      commandName: 'window',
      args: ['POST', 'other-window']
    });
  });

  it('testWindowCommand', function() {
    let protocol = this.protocol;

    assert.throws(
      function() {
        protocol.window('POST');
      }, 'POST method without a name param throws an error'
    );

    assert.throws(
      function() {
        protocol.window('GET');
      }, 'GET method throws an error'
    );
  });

  it('test .minimizeWindow()', function() {
    return Globals.protocolTest({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'POST');
        assert.strictEqual(opts.path, '/session/1352110219202/window/minimize');
      },
      commandName: 'minimizeWindow'
    });
  });

  ////////////////////////////////////////////////////////////////////////
  // W3C Webdriver
  ////////////////////////////////////////////////////////////////////////
  it('testSwitchWindow W3C WebDriver', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.path, '/session/1352110219202/window');
        assert.deepStrictEqual(opts.data, {handle: 'other-window'});
      },
      commandName: 'window',
      args: ['POST', 'other-window']
    });
  });

  it('test .windowHandle() W3C WebDriver', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.path, '/session/1352110219202/window');
      },
      commandName: 'windowHandle',
      args: []
    });
  });

  it('test .windowMaximize()', function() {
    return Globals.protocolTest({
      assertion: function(opts) {
        assert.strictEqual(opts.path, '/session/1352110219202/window/current/maximize');
      },
      commandName: 'windowMaximize',
      args: []
    });
  });

  it('test .windowMaximize() W3C WebDriver', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'POST');
        assert.strictEqual(opts.path, '/session/1352110219202/window/maximize');
      },
      commandName: 'windowMaximize',
      args: []
    });
  });

  it('test .windowHandles() W3C WebDriver', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'GET');
        assert.strictEqual(opts.path, '/session/1352110219202/window/handles');
      },
      commandName: 'windowHandles',
      args: []
    });
  });

  it('test .minimizeWindow() W3C WebDriver', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'POST');
        assert.strictEqual(opts.path, '/session/1352110219202/window/minimize');
      },
      commandName: 'minimizeWindow',
      args: []
    });
  });

  it('test .openNewWindow() W3C WebDriver', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'POST');
        assert.deepStrictEqual(opts.data, {type: 'tab'});
        assert.strictEqual(opts.path, '/session/1352110219202/window/new');
      },
      commandName: 'openNewWindow',
      args: []
    });
  });


  it('test .openNewWindow() W3C WebDriver with callback', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'POST');
        assert.deepStrictEqual(opts.data, {type: 'tab'});
        assert.strictEqual(opts.path, '/session/1352110219202/window/new');
      },
      commandName: 'openNewWindow',
      args: [function() {}]
    });
  });

  it('test .openNewWindow() W3C WebDriver with specified type=window', function() {
    return Globals.protocolTestWebdriver({
      assertion: function(opts) {
        assert.strictEqual(opts.method, 'POST');
        assert.deepStrictEqual(opts.data, {type: 'window'});
        assert.strictEqual(opts.path, '/session/1352110219202/window/new');
      },
      commandName: 'openNewWindow',
      args: ['window']
    });
  });



  it('test .openNewWindow() with unhandled error', function() {
    return Globals.runProtocolTestWithError({
      url: '/wd/hub/session/1352110219202/window/new',
      commandName: 'openNewWindow'
    });
  });

  it('test .minimizeWindow() with unhandled error', function() {
    return Globals.runProtocolTestWithError({
      url: '/wd/hub/session/1352110219202/window/minimize',
      commandName: 'minimizeWindow'
    });
  });

  it('test .windowHandles() with unhandled error', function() {
    return Globals.runProtocolTestWithError({
      url: '/wd/hub/session/1352110219202/window_handles',
      commandName: 'windowHandles',
      method: 'GET'
    });
  });

  it('test .windowHandle() with unhandled error', function() {
    return Globals.runProtocolTestWithError({
      url: '/wd/hub/session/1352110219202/window_handle',
      commandName: 'windowHandle',
      method: 'GET'
    });
  });


});
