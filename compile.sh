#/bin/sh

npm install form-tag-helper && npm install form-options-helper && npm install asset-tag-helper && npm install cream && npm install date-helper && npm install url-helper
coffee -c cafe.coffee
browserify cafe.coffee -o browser-cafe.js
yuicompressor browser-cafe.js > browser-cafe.min.js
