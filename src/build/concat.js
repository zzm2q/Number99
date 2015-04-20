var fs = require('fs');

var html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
var scriptRegex = /<\!-- script -->([\s\S]*?)<\!-- script end -->/ig;
var scriptContent = scriptRegex.exec(html)[1];
var scriptTagRegex = /<script src="([\s\S]*?)"><\/script>/ig;

var jsContent = '';

var result = scriptContent.match(scriptTagRegex);
if(result && result.length > 0) {
    result.forEach(function(content) {
        var src = /"([\s\S]*?)"/ig.exec(content)[1];
        console.log('concat ' + src);
        jsContent += fs.readFileSync(__dirname + '/../' + src, 'utf8') + ';\n';
    });
}

fs.writeFileSync('dist/all.js', jsContent, 'utf8');