#!/bin/sh

workpath=$(cd `dirname $0`; pwd)/
cd ${workpath}

rsync -rvt ./dist/ root@119.29.118.230:/usr/share/nginx/html/number99
