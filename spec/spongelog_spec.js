describe('SpongeLog', function () {

  var subject;

  beforeEach(function () {
    // stub to call callback immediately
    window.setInterval = function (cb) { cb(); };

    // stub xhr calls
    SpongeLog.prototype.xhr = function () {};

    subject = new SpongeLog({
      url: 'some/api',
      interval: 3000,
      sessionData: {
        uuid: 'asd123'
      }
    });
  });

  describe('setting options', function () {

    it('sets the url', function () {
      expect( subject.url ).toBe( 'some/api' );
    });

    it('sets the interval', function () {
      expect( subject.interval ).toBe( 3000 );
    });

    it('sets session data', function () {
      expect( subject.sessionData ).toEqual({ uuid: 'asd123' });
    });

    describe('with no interval', function () {
      beforeEach(function () {
        subject = new SpongeLog({ url: 'asd' });
      });

      it('uses the default', function () {
        expect( subject.interval ).toBe( 20000 );
      });
    });

  });

  describe('when an exception is thrown', function () {
    beforeEach(function () {
      // mimick an exception (jasmine soaks them all)
      window.onerror('facepalm', 'app.js', 33);
    });

    it('records a "exception" event', function () {
      var event = subject.events[0];

      expect( event ).not.toBe( undefined );
      expect( event.name ).toBe( 'exception' );
      expect( event.source ).toBe( 'app.js:L33' );
      expect( event.message ).toBe( 'facepalm' );
    });
  });

  describe('when console.log is called', function () {
    beforeEach(function () {
      window.console.log('test log message');
    });

    it('records a "log" event', function () {
      var event = subject.events[0];

      expect( event ).not.toBe( undefined );
      expect( event.name ).toBe( 'log' );
      expect( event.source ).toBe( 'console' );
      expect( event.message ).toBe( 'test log message' );
    });
  });

  describe('when console.error is called', function () {
    beforeEach(function () {
      window.console.error('test error message');
    });

    it('records a "error" event', function () {
      var event = subject.events[0];

      expect( event ).not.toBe( undefined );
      expect( event.name ).toBe( 'error' );
      expect( event.source ).toBe( 'console' );
      expect( event.message ).toBe( 'test error message' );
    });
  });

  describe('when console.info is called', function () {
    beforeEach(function () {
      window.console.info('test info message');
    });

    it('records a "info" event', function () {
      var event = subject.events[0];

      expect( event ).not.toBe( undefined );
      expect( event.name ).toBe( 'info' );
      expect( event.source ).toBe( 'console' );
      expect( event.message ).toBe( 'test info message' );
    });
  });

  describe('when console.debug is called', function () {
    beforeEach(function () {
      window.console.debug('test debug message');
    });

    it('records a "debug" event', function () {
      var event = subject.events[0];

      expect( event ).not.toBe( undefined );
      expect( event.name ).toBe( 'debug' );
      expect( event.source ).toBe( 'console' );
      expect( event.message ).toBe( 'test debug message' );
    });
  });

  describe('sync', function () {
    var data;

    describe('with recorded events', function () {
      beforeEach(function () {
        data = {
          name: 'log',
          source: 'console',
          message: 'test log message',
          occuredAt: new Date()
        };

        subject.sessionData = {};

        subject.events.push(data);
      });

      it('makes an xhr request with the current url and data', function () {
        spyOn( subject, 'xhr' );
        subject.sync();
        expect( subject.xhr ).toHaveBeenCalledWith('POST', 'some/api', [data]);
      });

      describe('and with sessionData', function () {
        beforeEach(function () {
          subject.sessionData = { uuid: 'asd123' };
        });

        it('merges events and sessionData', function () {
          spyOn( subject, 'xhr' );
          subject.sync();
          expect( subject.xhr ).toHaveBeenCalledWith('POST', 'some/api', [{
            name: 'log',
            source: 'console',
            message: 'test log message',
            occuredAt: data.occuredAt,
            uuid: 'asd123'
          }]);
        });
      });
    });

    describe('with norecorded events', function () {
      beforeEach(function () {
        subject.events = [];
      });

      it('makes an xhr request with the current url and data', function () {
        spyOn( subject, 'xhr' );
        subject.sync();
        expect( subject.xhr ).not.toHaveBeenCalled();
      });
    });
  });

  describe('startIntervalTimer', function () {
    beforeEach(function () {
      spyOn( window, 'setInterval' ).andCallThrough();
      spyOn( subject, 'sync' );
    });

    it('sets up a timer to call `sync` at the given interval', function () {
      subject.startIntervalTimer();
      expect( window.setInterval ).toHaveBeenCalled();
      expect( subject.sync ).toHaveBeenCalled();
    });
  });

  describe('stopIntervalTimer', function () {
    beforeEach(function () {
      subject.intervalID = 'asd123';
      spyOn( window, 'clearInterval' );
    });

    it('calls clearInterval with the intervalID', function () {
      subject.stopIntervalTimer();
      expect( window.clearInterval ).toHaveBeenCalledWith(
        'asd123'
      );
    });
  });

  describe('squarePants', function () {
    it('is no', function () {
      expect( subject.squarePants ).toBe( 'no' );
    });
  });

});
