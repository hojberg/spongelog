(function () {

  // -- Originals -------------------------------------------------------------

  var _console = window.console,
      _onerror = window.onerror;

  // -- Helpers ---------------------------------------------------------------

  /**
  @method each
  @private
  **/
  var each = function (arr, callback, context) {
    for (var i = 0, len = arr.length; i < len; i++) {
      callback.call(context, arr[i], i);
    }
  };

  /**
  simple abstraction over XMLHttpRequest

  @method xhr
  @param {String} method 'GET' or 'POST'
  @param {String} url the request url
  @param {Object|Array} [data]
  @param {Function} [callback] executed on request completion
  @private
  **/
  var xhr = function (method, url, data, callback) {
    var req = new window.XMLHttpRequest();

    req.onreadystatechange = function () {
      if (typeof callback === 'function') {
        callback(req);
      }
    };

    req.open(method, url);

    if (method === 'POST' && data) {
      req.setRequestHeader('Content-Type', 'application/json');
      req.send(JSON.stringify(data));
    }
    else {
      req.send();
    }
  };

  // -- Constants -------------------------------------------------------------

  var INTERVAL = 20000;

  // -- EventEmitter ----------------------------------------------------------

  /**
  @class EventEmitter
  @constructor
  **/
  var EventEmitter = function () {
    this._handlers = {
      'log':        [],
      'info':       [],
      'error':      [],
      'debug':      [],
      'exception':  []
    };

    this.setupSniffers();
  };

  EventEmitter.prototype = {

    /**
    @method setupSniffers
    **/
    setupSniffers: function () {
      this._setupLogSniffer();
      this._setupExceptionSniffer();
    },

    /**
    calls listeners of an event type

    @method emit
    @param {String} eventType
    @param {Object} [payload] any data to pass on the listener
    **/
    emit: function (eventType, payload) {
      var handlers = this._handlers[eventType];

      if (handlers) {
        each(handlers, function (handler) {
          handler.fn.call(handler.context, payload);
        }, this);
      }
    },

    /**
    @method on
    @param {String} eventType
    @param {Function} handler
    @param {Object} [context]
    **/
    on: function (eventType, handler, context) {
      this._handlers[eventType].push({
        fn: handler,
        context: context || this
      });
    },

    /**
    attaches a sniffer around console.log

    @method _setupLogSniffer
    @protected
    **/
    _setupLogSniffer: function () {
      var that = this, store,
          log, info, error, debug;

      store = function (name, message) {
        var arguments = Array.prototype.slice.apply(arguments, [1]);

        that.emit(name, {
          name:       name,
          source:     'console',
          message:    message,
          occuredAt:  new Date()
        });

        // call the original console.log
        if (_console) _console[name].apply(_console, arguments);
      };

      log   = function (message) { store('log',   message) };
      info  = function (message) { store('info',  message) };
      error = function (message) { store('error', message) };
      debug = function (message) { store('debug', message) };

      // overwrite the window console to sniff log statements
      window.console = {
        log:    log,
        info:   info,
        error:  error,
        debug:  debug
      };
    },

    /**
    attaches a sniffer around window.onerror
    which is called after an exceptions

    @method _setupExceptionSniffer
    @protected
    **/
    _setupExceptionSniffer: function () {
      var that = this;

      window.onerror = function (error, url, line) {
        that.emit('exception', {
          name:       'exception',
          source:     url + ':L' + line,
          message:    error,
          occuredAt:  new Date()
        });

        // call original onerror handler
        if (_onerror) {
          _onerror.apply(this, arguments);
        }
      };
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

    this.startIntervalTimer();
  };

  SpongeLog.prototype = {

    /**
    @method attachEvent
    **/
    attachEvents: function () {
      this.eventEmitter.on('log',       this.record, this);
      this.eventEmitter.on('info',      this.record, this);
      this.eventEmitter.on('error',     this.record, this);
      this.eventEmitter.on('debug',     this.record, this);
      this.eventEmitter.on('exception', this.record, this);
    },

    /**
    @method record
    @param {Object} event the event to record
    **/
    record: function (event) {
      this.events.push(event);
    },

    /**
    @method sync
    **/
    sync: function () {
      // extract all events and clearing out the events array
      var events = this.events.splice(0, this.events.length);

      if (events.length) {
        this.xhr('POST', this.url, events);
      }
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
    },

    /**
    @method startIntervalTimer
    **/
    startIntervalTimer: function () {
      var that = this;

      this.intervalID = window.setInterval(function () {
        that.sync.call(that);
      }, this.interval);
    },

    /**
    @method stopIntervalTimer
    **/
    stopIntervalTimer: function () {
      if (this.intervalID) {
        window.clearInterval(this.intervalID);
      }
    }

  };

  // -- Expose API ------------------------------------------------------------

  window.SpongeLog = SpongeLog;

}());
