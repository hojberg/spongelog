(function () {

  // window.console shim
  if (!window.console) {
    window.console = {
      log:    function () {},
      info:   function () {},
      warn:   function () {},
      error:  function () {},
      debug:  function () {}
    };
  }

  // -- Originals -------------------------------------------------------------

  var Originals = {
    console: window.console,
    onerror: window.onerror,
    xhropen: window.XMLHttpRequest.prototype.open,
    xhrsend: window.XMLHttpRequest.prototype.send
  };

  // -- Helpers ---------------------------------------------------------------

  /**
  @method each
  @param {Array} arr
  @param {Function} callback
  @param {Any} [context]
  @private
  **/
  var each = function (arr, callback, context) {
    for (var i = 0, len = arr.length; i < len; i++) {
      callback.call(context, arr[i], i);
    }
  };
  /**
  @method isArray
  @param {Any} val
  @private
  **/
  var isArray = function (val) {
    return Object.prototype.toString.call(val) === "[object Array]";
  };

  /**
  @method map
  @param {Array} arr
  @param {Function} callback
  @param {Any} [context]
  @return {Array}
  @private
  **/
  var map = function (arr, callback, context) {
    var newArr = [];

    for (var i = 0, len = arr.length; i < len; i++) {
      newArr.push(callback.call(context, arr[i], i));
    }

    return newArr;
  };

  /**
  @method merge
  @return {Object}
  **/
  var merge = function () {
    var result = {},
        arr = Array.prototype.slice.call(arguments, 0);

    each(arr, function (obj) {
      for (var key in obj) {
        result[key] = obj[key];
      }
    });

    return result;
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
      if (this.readyState === 4 && typeof callback === 'function') {
        callback(req);
      }
    };

    // we don't want to go through the displaced XHR for flushing events
    req.open = Originals.xhropen;
    req.send = Originals.xhrsend;

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

  var FLUSH_FREQUENCY = 20000;

  // -- EventEmitter ----------------------------------------------------------

  /**
  @class EventEmitter
  @constructor
  **/
  var EventEmitter = function (options) {
    this.xhrIgnoreDomains = options.xhrIgnoreDomains || [];

    this._handlers = {
      'log':          [],
      'info':         [],
      'error':        [],
      'debug':        [],
      'exception':    [],
      'xhr:request':  [],
      'xhr:response': []
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
      this._setupXHRSniffer();
    },

    /**
    calls listeners of an event type

    @method emit
    @param {String} eventType
    @param {Object} [payload] any data to pass on the listener
    **/
    emit: function (eventType, payload) {
      var handlers = this._handlers[eventType];

      if (isArray(payload.message)) {
        payload.message = payload.message.join(' | ');
      }

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
    @method shouldIgnoreURL
    @return {Boolean}
    **/
    shouldIgnoreURL: function (url) {
      var domains = this.xhrIgnoreDomains,
          shouldIgnore = false;

      each(domains, function (domain) {
        if (url.indexOf(domain) !== -1) {
          shouldIgnore = true;
        }
      });

      return shouldIgnore;
    },

    /**
    attaches a sniffer around console.log

    @method _setupLogSniffer
    @protected
    **/
    _setupLogSniffer: function () {
      var emitter = this,
          displacer;

      if (!Originals.console) {
        window.console    = {};
        Originals.console = window.console;
      }

      displacer = function (method) {
        var original = Originals.console[method];

        return function () {
          var message = Array.prototype.slice.apply(arguments).join(' ');

          emitter.emit(method, {
            level: method === 'log' ? 'info' : method,
            message: message,
            occurredAt: new Date()
          });

          if (typeof original === 'function') {
            if (original.apply) {
              original.apply(Originals.console, arguments);
            }
            else {
              original(message);
            }
          }
        };
      };

      each(['log', 'info', 'warn', 'error', 'debug'], function (method) {
        window.console[method] = displacer(method);
      });
    },

    /**
    attaches a sniffer around window.onerror
    which is called after an exceptions

    @method _setupExceptionSniffer
    @protected
    **/
    _setupExceptionSniffer: function () {
      var emitter = this;

      window.onerror = function (error, url, line) {
        emitter.emit('exception', {
          level: 'error',
          message: 'Exception: ' + url + ':L' + line + ' ' + error,
          occurredAt: new Date()
        });

        // call original onerror handler
        if (Originals.onerror) {
          Originals.onerror.apply(this, arguments);
        }
      };
    },

    /**
    attaches a sniffer around XMLHttpRequest

    @method _setupXHRSniffer
    @protected
    **/
    _setupXHRSniffer: function () {
      var emitter = this,
          tid     = 0,
          _method, _url;

      // displace XMLHttpRequest.open
      XMLHttpRequest.prototype.open = function (method, url) {
        _method = method;
        _url    = url;

        Originals.xhropen.apply(this, arguments);
      };

      // add a function over readonly response for easy stubbing
      XMLHttpRequest.prototype._getResponse = function () {
        return {
          status:       this.status,
          statusText:   this.statusText,
          responseText: this.responseText
        };
      };

      // add a function over readonly readyState for easy stubbing
      XMLHttpRequest.prototype._isRequestDone = function () {
        return this.readyState === 4;
      };

      // displace XMLHttpRequest.send
      XMLHttpRequest.prototype.send = function () {
        var _tid = tid++,
            source = ['['+_tid+']:', _method, _url].join(' ');

        if (!emitter.shouldIgnoreURL(_url)) {
          // displace onreadystatechange inside send as it is attached
          // after newing up XMLHttpRequest
          var _onreadystatechange = this.onreadystatechange;

          this.onreadystatechange = function () {
            var response;

            if (this._isRequestDone()) {
              response  = this._getResponse();

              emitter.emit('xhr:response', {
                message: 'xhr:response ' + source + ' ' + response.status,
                level: 'info',
                occurredAt:  new Date()
              });
            }

            if (typeof _onreadystatechange === 'function') {
              _onreadystatechange.apply(this, arguments);
            }
          };

          emitter.emit('xhr:request', {
            message: 'xhr:request ' + source,
            level: 'info',
            occurredAt:  new Date()
          });
        }

        Originals.xhrsend.apply(this, arguments);
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
    this.flushFrequency = options.flushFrequency || FLUSH_FREQUENCY;
    this.sessionData = options.sessionData || {};

    this.events = [];
    this.eventEmitter = new EventEmitter({
      xhrIgnoreDomains: options.xhrIgnoreDomains
    });

    this.attachEvents();

    this.startIntervalTimer();
  };

  SpongeLog.Originals = Originals;

  SpongeLog.prototype = {

    /**
    @method attachEvent
    **/
    attachEvents: function () {
      this.eventEmitter.on('log',           this.record, this);
      this.eventEmitter.on('info',          this.record, this);
      this.eventEmitter.on('error',         this.record, this);
      this.eventEmitter.on('debug',         this.record, this);
      this.eventEmitter.on('exception',     this.record, this);
      this.eventEmitter.on('xhr:request',   this.record, this);
      this.eventEmitter.on('xhr:response',  this.record, this);
    },

    /**
    @method record
    @param {Object} event the event to record
    **/
    record: function (event) {
      this.events.push(event);
    },

    /**
    @method flush
    **/
    flush: function () {
      // extract all events and clearing out the events array
      var events      = this.events.splice(0, this.events.length),
          sessionData = this.sessionData;

      if (sessionData) {
        events = map(events, function (ev) {
          return merge(ev, sessionData);
        });
      }

      if (events.length) {
        this.xhr('POST', this.url, { events: events });
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
        that.flush.call(that);
      }, this.flushFrequency);
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
