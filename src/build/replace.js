var fs = require('fs');

var content = fs.readFileSync(__dirname + '/dist/index.html', 'utf8');
content = content.replace(/<\!-- script -->[\s\S]*?<\!-- script end -->/ig, '<script src="all.min.js"></script>');
fs.writeFileSync(__dirname + '/dist/index.html', content, 'utf8');