(function (global) {

  // -- Helpers ---------------------------------------------------------------

  var each = function (arr, callback, context) {
    for (var i = 0, len = arr.length; i < len; i++) {
      callback.call(context, arr[i], i);
    }
  };

  var xhr = function (url, method, callback) {
  };

  // -- Constants -------------------------------------------------------------

  var INTERVAL = 20000;

  // -- EventEmitter ----------------------------------------------------------

  var EventEmitter = function () {
    this._handlers = {
      'log': []
    };

    this.setupShims();
  };

  EventEmitter.prototype = {

    setupShims: function () {
      this._setupLogShim();
    },

    emit: function (eventType, data) {
      each(this._handlers[eventType], function (handler) {
        handler.fn.call(handler.context, data);
      }, this);
    },

    on: function (eventType, handler, context) {
      this._handlers[eventType].push({
        fn: handler,
        context: context || this
      });
    },

    _setupLogShim: function () {
      var oldConsole = global.console,
          that = this,
          log;

      log = function (message) {
        that.emit('log', { type: 'log', message: message });
        if (oldConsole) oldConsole.log.apply(oldConsole, arguments);
      };

      // overwrite the global console to sniff log statements
      global.console = { log: log };
    }

  };

  // -- SpongeLog -------------------------------------------------------------

  /**
  @class SpongeLog
  @constructor
  **/
  var SpongeLog = function (options) {
    this.url = options.url;
    this.interval = options.interval || INTERVAL;

    this.events = [];
    this.eventEmitter = new EventEmitter();

    this.attachEvents();
  };

  SpongeLog.prototype = {

    events: [],

    attachEvents: function () {
      this.eventEmitter.on('log', this.record, this);
    },

    record: function (event) {
      this.events.push(event);
    },

    /**
    @easteregg
    **/
    squarePants: 'no',

    /**
    performs an xhr request

    @method xhr
    **/
    xhr: function () {
      xhr.apply(this, arguments);
    }

  };

  // -- Expose API ------------------------------------------------------------

  global.SpongeLog = SpongeLog;

}(window));
