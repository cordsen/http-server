var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    ecstatic = require('ecstatic'),
    assetTypes = [".js", ".css", ".txt", ".ico", ".html", ".png", ".woff"];


function isStaticResource(url) {
  return assetTypes.reduce(function(memo, assetType) {
    return memo || url.indexOf(assetType) !== -1;
  }, false);
}

var HTTPServer = exports.HTTPServer = function (options) {
  options = options || {};

  if (options.root) {
    this.root = options.root;
  }
  else {
    try {
      fs.lstatSync('./public');
      this.root = './public';
    }
    catch (err) {
      this.root = './';
    }
  }

  if (options.headers) {
    this.headers = options.headers;
  }

  this.cache = options.cache || 3600; // in seconds.
  this.showDir = options.showDir !== 'false';
  this.autoIndex = options.autoIndex !== 'false';

  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }

  this.server = union.createServer({
    before: (options.before || []).concat([
      function (req, res) {
        if (options.singlePage && !isStaticResource(req.url)) {
          console.log("remap request to single page app ".yellow
            +req.url.cyan);
          req.url = "/index.html";
        }
        options.logFn && options.logFn(req, res);
        res.emit('next');
      },
      ecstatic({
        root: this.root,
        cache: this.cache,
        showDir : this.showDir,
        autoIndex: this.autoIndex,
        defaultExt: this.ext
      })
    ]),
    headers: this.headers || {}
  });
};

HTTPServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

HTTPServer.prototype.close = function () {
  return this.server.close();
};

exports.createServer = function (options) {
  return new HTTPServer(options);
};
