var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    handlebars = require('handlebars'),
    htmlToText = require('html-to-text'), //For getting the plain text version of an email
    tempie = {
      dir: 'templates', //templates location
      config: 'emails.json',
      base: handlebars.compile( //base HTML
        '<html>\n' +
          '\t<head>\n' +
            '\t\t<style>{{{css}}}</style>\n' +
          '\t</head>\n' +
          '\t<body>{{{content}}}</body>\n' +
        '</html>'
      ),
      defaults: {
        subject: 'No Subject'
      },
      emails: {} //cache
    };

var _private =  {
  loaded: false,

  //Supported file extensions
  exts: {
    template: ['htm','html'], //Actual HTML templates
    style: ['css'] //Style files
  },

  spacePlaceholder: '%%%%tplspace%%%%',

  /*
   * Returns an array of resolved file paths, appending all the given extentions.
   */
  getList: function(extType, filename, dir) {
    if(!_private.exts.hasOwnProperty(extType)) {
      return [];
    }

    var files = [];

    for(var e = 0; e < _private.exts[extType].length; e++) {
      files.push(path.join(dir, filename + '.' + _private.exts[extType][e]));
    }

    return files;
  },

  /*
   * Given a list of files, returns the contents of the first one that exists. 
   * If none of the files exist, an empty string is returned.
   */
  getFile: function(files, callback) {
    async.waterfall([
      function(cb) {
        async.detect(files, fs.exists, function(file) {
          cb(null, file);
        });
      },

      function(file, cb) {
        if(!file) {
          return cb(null, new Buffer(''));
        }

        fs.readFile(file, cb);        
      }
    ], function(err, contents) {
      callback(null, contents.toString());
    });
  },

  /*
   * Returns the an email configuration, loading the configuration file if necessary.
   */
  getEmail: function(name, callback) {
    if(_private.loaded) {
      return callback(null, tempie.emails[name]);
    }

    var file = path.resolve(tempie.dir, tempie.config);

    async.waterfall([
      function(cb) {
        fs.exists(file, function(exists) {
          if(exists) {
            tempie.emails = require(file);
          }

          _private.loaded = true;
          cb(null);
        });
      }
    ], function(err) {
      if(err) {
        return callback(err);
      }

      callback(null, tempie.emails[name]);
    });
  },

  /*
   * Finds, loads, and builds a template for use.
   */
  load: function(name, src, callback) {
    var folder = path.resolve(tempie.dir, src),
      file = src,
      ext = path.extname(file),
      tpl = {};

    if(ext.length > 0 && _private.exts.all.indexOf(ext.replace('.', '')) >= 0) {
      folder = folder.replace(new RegExp(ext + '$'), '');
    }
    
    async.waterfall([
      function(cb) {
        fs.stat(folder, function(err, stats) {
          if(typeof stats === 'undefined' || !stats.isDirectory()) {
            folder = path.resolve(tempie.dir);
          } else {
            file = path.basename(src);
          }

          cb();
        });
      },

      //Load the JSON config, if applicatable
      function(cb) {
        _private.getFile([path.join(folder, file + '.json')], cb);
      },
      
      //Load the HTML template
      function(config, cb) {
        if(config.length > 0) {
          tpl = JSON.parse(config);
        }

        _private.getFile(_private.getList('template', file, folder), cb);
      },

      //Load the CSS, if any
      function(tplFile, cb) {
        //An HTML template is required
        if(tplFile.length === 0) {
          return cb(new Error('No HTML template was found.'));
        }

        tpl.html = tplFile;
        _private.getFile(_private.getList('style', file, folder), cb);
      },

      function(cssFile, cb) {
        tpl.css = cssFile;
        cb(null);
      }
    ], function(err) {
      callback(err, tpl);
    });
  }
};

//Builds an array of all the templates
_private.exts.all = _private.exts.template.concat(
  _private.exts.text,
  _private.exts.style
);

tempie.load = function(name, data, callback) {
  if(typeof data === 'function') {
    callback = data;
    data = {};
  }

  var selected = {};

  async.waterfall([
    function(cb) {
      _private.getEmail(name, cb);
    },

    function(email, cb) {
      selected = email || {};

      if(selected.hasOwnProperty('html')) {
        return cb(null, selected);
      }

      _private.load(name, selected.file || name, cb);
    },

    function(tpl, cb) {
      //Return a copy of the template
      var tmp = {};
      for(var k in tpl) {
        tmp[k] = tpl[k];
      }

      if(typeof tmp.html === 'string') {
        tmp.html = handlebars.compile(tmp.html);
      }
      
      cb(null, tmp);
    }
  ], function(err, tpl) {
    if(!tempie.emails.hasOwnProperty(name)) {
      tempie.emails[name] = {};

      //Copy the defaults
      for(var k in tempie.defaults) {
        tempie.emails[name][k] = tempie.defaults[k];
      }

      selected = tempie.emails[name];
    }

    //Shallow copy of the selected email template
    for(var k in selected) {
      if(!tpl.hasOwnProperty(k)) {
        tpl[k] = selected[k];
      }
    }

    //Build the cache
    for(var k in tpl) {
      tempie.emails[name][k] = tpl[k];
    }


    if(tpl.hasOwnProperty('html')) {
      //Compile the HTML
      tpl.html = tpl.html(data);
      tpl.html = tempie.base({
        css: tpl.css,
        content: tpl.html
      });

      //html-to-text is a little aggressive with the white space removal,
      //so we add placeholders to replace later
      tpl.text = tpl.html
        .replace(' <', _private.spacePlaceholder + '<')
        .replace('> ', '>' + _private.spacePlaceholder);

      //Create a text only version
      tpl.text = htmlToText.fromString(tpl.text);

      //Put the spaces back
      tpl.text = tpl.text.replace(new RegExp(_private.spacePlaceholder, 'g'), ' ');
    }

    //The CSS in the tpl is part of the HTML
    delete tpl.css;

    callback(err, tpl);
  });
};

module.exports = tempie;