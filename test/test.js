var assert = require('assert'),
    async = require('async'),
    tempie = require('./../tempie'),
    unoData = {it:1},
    dosData = {it:1},
    tresData = {it:1};

async.waterfall([
  function(cb) {
    tempie.load('uno', unoData, cb);
  },

  function(email, cb) {
    assert.equal(email.subject, 'This is the first email');
    assert.equal(email.html, '<html>\n\t<head>\n\t\t<style></style>\n\t</head>\n\t<body><p>This is trial <em>1<em/> of the first email.</p></body>\n</html>');
    assert.equal(email.text, 'This is trial 1 of the first email.');

    //Tests if the cache was set correctly
    assert.equal(tempie.emails.uno.subject, email.subject);
    assert.equal(typeof tempie.emails.uno.html, 'function');

    //Cause the real config to be loaded
    tempie.config = 'all.json'
    tempie.reset();
    tempie.load('dos', dosData, cb);
  },

  function(email, cb) {
    assert.equal(email.subject, 'This is the second email!');
    assert.equal(email.html, '<html>\n\t<head>\n\t\t<style></style>\n\t</head>\n\t<body><p>This is trial <em>1<em/> of the second email.</p></body>\n</html>');
    assert.equal(email.text, 'This is trial 1 of the second email.');

    tempie.load('tres', tresData, cb);
  },

  function(email, cb) {
    assert.equal(email.subject, 'No Subject');
    assert.equal(email.html, '<html>\n\t<head>\n\t\t<style>body {\r\n  background-color: #0000bb;\r\n}</style>\n\t</head>\n\t<body><p>This is trial <em>1<em/> of the third email.</p></body>\n</html>');
    assert.equal(email.text, 'This is trial 1 of the third email.');

    unoData.it = 2;
    tempie.load('uno', unoData, cb);
  },

  function(email, cb) {
    assert.equal(email.subject, 'This is the first email');
    assert.equal(email.html, '<html>\n\t<head>\n\t\t<style></style>\n\t</head>\n\t<body><p>This is trial <em>2<em/> of the first email.</p></body>\n</html>');
    assert.equal(email.text, 'This is trial 2 of the first email.');

    cb();
  }

], function(err) {

});