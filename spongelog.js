(function () {

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
      'log': []
    };

    this.setupSniffers();
  };

  EventEmitter.prototype = {

    /**
    @method setupSniffers
    **/
    setupSniffers: function () {
      this._setupLogSniffer();
    },

    /**
    calls listeners of an event type

    @method emit
    @param {String} eventType
    @param {Object} [payload] any data to pass on the listener
    **/
    emit: function (eventType, payload) {
      each(this._handlers[eventType], function (handler) {
        handler.fn.call(handler.context, payload);
      }, this);
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
      var oldConsole = window.console,
          that = this,
          log;

      log = function (message) {
        that.emit('log', {
          type:       'log',
          message:    message,
          occuredAt:  new Date()
        });

        // call the original console.log
        if (oldConsole) oldConsole.log.apply(oldConsole, arguments);
      };

      // overwrite the window console to sniff log statements
      window.console = { log: log };
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
      this.eventEmitter.on('log', this.record, this);
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

      this.xhr('POST', this.url, events);
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
