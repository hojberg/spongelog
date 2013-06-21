describe('SpongeLog', function () {

  var subject;

  beforeEach(function () {
    // stub to call callback immediately
    window.setInterval = function (cb) { cb(); };

    // stub xhr calls
    SpongeLog.prototype.xhr = function () {};

    subject = new SpongeLog({
      url: 'some/api',
      interval: 3000
    });
  });

  describe('setting options', function () {

    it('sets the url', function () {
      expect( subject.url ).toBe( 'some/api' );
    });

    it('sets the interval', function () {
      expect( subject.interval ).toBe( 3000 );
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

  describe('when console.log is called', function () {
    beforeEach(function () {
      window.console.log('test log message');
    });

    it('records a "log" event', function () {
      var event = subject.events[0];

      expect( event ).not.toBe( undefined );
      expect( event.type ).toBe( 'log' );
      expect( event.message ).toBe( 'test log message' );
    });
  });

  describe('sync', function () {
    var data;

    describe('with recorded events', function () {
      beforeEach(function () {
        data = { type: 'log', message: 'test log message', occuredAt: new Date() }
        subject.events.push(data);
      });

      it('makes an xhr request with the current url and data', function () {
        spyOn( subject, 'xhr' );
        subject.sync();
        expect( subject.xhr ).toHaveBeenCalledWith('POST', 'some/api', [data]);
      });
    });

    describe('with no eventsrecorded events', function () {
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
