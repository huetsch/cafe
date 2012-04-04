#/bin/sh

npm install asset-tag-helper && npm install cream && npm install date-helper && npm install url-helper
browserify cafe.coffee -o browser-cafe.js
yuicompressor browser-cafe.js > browser-cafe.min.js
