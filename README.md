SpongeLog
=========

[![Build Status](https://travis-ci.org/hojberg/spongelog.png)](https://travis-ci.org/hojberg/spongelog)

Ain't got no square pants

# How to use SpongeLog

Simply instantiate spongelog to begin collecting log and error events:

```javascript
new SpongeLog({
  url: 'http://theserverurl'
});
```

## Manually record events
```javascript
var spongeLog = new SpongeLog({
  url: 'http://theserverurl'
});

spongeLog.record({
  name:       '',
  source:     '',
  message:    '',
  occuredAt:  new Date()
});
```

## Manually flush back to the server
```javascript
var spongeLog = new SpongeLog({
  url: 'http://theserverurl'
});

spongeLog.flush();
```

## Set the flush frequency
Default is `20000` (20 seconds)

```javascript
var spongeLog = new SpongeLog({
  url: 'http://theserverurl',
  flushFrequency: 4000
});
```

## Add session data to each event
```javascript
var spongeLog = new SpongeLog({
  url: 'http://theserverurl',
  sessionData: {
    userId: '32AS432SX'
  }
});
```
