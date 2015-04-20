#!/bin/sh

workpath=$(cd `dirname $0`; pwd)/
cd ${workpath}

rm -R dist
mkdir dist

cp -R ../images dist/
cp ../index.html dist/
cp ../arrow.png dist/
cp ../choose.png dist/
cp ../sprite.tt.json dist/
cp ../sprite.tt.png dist/
cp ../NG.o dist/

node replace.js

sencha compile --debug=false --classpath=../libs,../NG,../main.js concatenate --output-file=dist/all_sencha.js

uglifyjs dist/all_sencha.js -o dist/all.min.js
rm dist/all_sencha.js


