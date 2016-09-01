# nightmare-evaluate-with-callback

Adds evaluateWithCallback action to [Nightmare](https://github.com/segmentio/nightmare). This will allow you to execute asynchronous code in the Nightmare's browser context and halt the evaluation chain until it returns.

Primitive arguments passed to the callback function will be fed to the next action in the chain, similar to calling return 'value'; in Nightmare's built in evaluate action.

## Install
```
$ npm install nightmare-evaluate-with-callback
```

## Usage

```javascript
var Nightmare = require('nightmare');
require('nightmare-evaluate-with-callback')(Nightmare);

var nightmare = Nightmare();

nightmare
  .goto('http://google.com')
  .evaluateWithCallback(function (callback) {
    setTimeout(function() {
      callback(document.location.href);
    }, 1000);
  })
  .end()
  .then(function (result) {
    console.log(result)
  })
  .catch(function (error) {
    console.error('Failed:', error);
  });
```
