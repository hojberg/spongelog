describe('SpongeLog', function () {

  var subject;

  beforeEach(function () {
    // stub to call callback immediately
    window.setInterval = function (cb) { cb(); };

    // stub xhr calls
    SpongeLog.prototype.xhr = function () {};

    subject = new SpongeLog({
      url: 'some/api',
      flushFrequency: 3000,
      sessionData: {
        uuid: 'asd123'
      }
    });
  });

  describe('setting options', function () {

    it('sets the url', function () {
      expect( subject.url ).toBe( 'some/api' );
    });

    it('sets the flushFrequency', function () {
      expect( subject.flushFrequency ).toBe( 3000 );
    });

    it('sets session data', function () {
      expect( subject.sessionData ).toEqual({ uuid: 'asd123' });
    });

    describe('with no flushFrequency', function () {
      beforeEach(function () {
        subject = new SpongeLog({ url: 'asd' });
      });

      it('uses the default', function () {
        expect( subject.flushFrequency ).toBe( 20000 );
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
      expect( event.type ).toBe( 'exception' );
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
      expect( event.type ).toBe( 'log' );
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
      expect( event.type ).toBe( 'error' );
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
      expect( event.type ).toBe( 'info' );
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
      expect( event.type ).toBe( 'debug' );
      expect( event.source ).toBe( 'console' );
      expect( event.message ).toBe( 'test debug message' );
    });
  });

  describe('when an xhr request is made', function () {
    var xhr;

    beforeEach(function () {
      // stub original xhr send
      spyOn( SpongeLog.Originals, 'xhropen' );
      spyOn( SpongeLog.Originals, 'xhrsend' );

      xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://something.com');
      xhr.send();
    });

    it('records an "xhr request" event', function () {
      var event = subject.events[0];

      expect( event ).not.toBe( undefined );
      expect( event.type ).toBe( 'xhr:request' );
      expect( event.source ).toContain( 'GET http://something.com' );
      expect( event.message ).toBe( '' );
    });

    it('calls Originals.xhropen', function () {
      expect( SpongeLog.Originals.xhropen ).toHaveBeenCalledWith(
        'GET',
        'http://something.com'
      );
    });

    it('calls Originals.xhrsend', function () {
      expect( SpongeLog.Originals.xhrsend ).toHaveBeenCalled();
    });
  });

  describe('after an xhr response', function () {
    beforeEach(function () {
      // stub original xhr send
      spyOn( SpongeLog.Originals, 'xhrsend' );

      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://something.com');

      spyOn( xhr, '_getResponse' ).andReturn({
        status: 200,
        statusText: '200 OK',
        responseText: '{"foo":"bar"}'
      });

      xhr.send();

      // mock onreadystatechange call to indicate response
      spyOn( xhr, '_isRequestDone' ).andReturn(true);
      xhr.onreadystatechange();
    });

    it('records an "xhr response" event', function () {
      var event = subject.events[1];

      expect( event ).not.toBe( undefined );
      expect( event.type ).toBe( 'xhr:response' );
      expect( event.source ).toContain( 'GET http://something.com' );
      expect( event.message ).toBe( '200 OK | {"foo":"bar"}' );
    });
  });

  describe('flush', function () {
    var data;

    describe('with recorded events', function () {
      beforeEach(function () {
        data = {
          type: 'log',
          source: 'console',
          message: 'test log message',
          occuredAt: new Date()
        };

        subject.sessionData = {};

        subject.events.push(data);
      });

      it('makes an xhr request with the current url and data', function () {
        spyOn( subject, 'xhr' );
        subject.flush();
        expect( subject.xhr ).toHaveBeenCalledWith('POST', 'some/api', [data]);
      });

      describe('and with sessionData', function () {
        beforeEach(function () {
          subject.sessionData = { uuid: 'asd123' };
        });

        it('merges events and sessionData', function () {
          spyOn( subject, 'xhr' );
          subject.flush();
          expect( subject.xhr ).toHaveBeenCalledWith('POST', 'some/api', [{
            type: 'log',
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
        subject.flush();
        expect( subject.xhr ).not.toHaveBeenCalled();
      });
    });
  });

  describe('startIntervalTimer', function () {
    beforeEach(function () {
      spyOn( window, 'setInterval' ).andCallThrough();
      spyOn( subject, 'flush' );
    });

    it('sets up a timer to call `flush` at the given flushFrequency', function () {
      subject.startIntervalTimer();
      expect( window.setInterval ).toHaveBeenCalled();
      expect( subject.flush ).toHaveBeenCalled();
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
