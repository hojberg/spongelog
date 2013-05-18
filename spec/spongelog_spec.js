describe('SpongeLog', function () {

  var subject;

  beforeEach(function () {
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

  describe('squarePants', function () {
    it('is no', function () {
      expect( subject.squarePants ).toBe( 'no' );
    });
  });

});
