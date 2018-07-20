var fs = require('fs');
var pathconst = require('path');
const readline = require('readline');
 
 
// if (process.argv.length <= 2) {
//     console.log("Usage: " + __filename + " path/to/directory");
//     process.exit(-1);
// }
 
// var path = process.argv[2];
// var mydir = path.join(__dirname, '/playlist/');
 
// fs.readdir(path, function(err, items) {
// 	// console.log(mydir);
// 	console.log(path);
//     console.log(items);
//     console.log(items.length);
 
//     for (var i=0; i<items.length; i++) {
//         console.log(items[i]);
//     }
// });

// fs.readdirSync(path).forEach(file => {
//   console.log(file);
// })

var filedir = pathconst.join(__dirname, '/playlist/playlist1.txt');

fs.readFile(filedir, 'utf8', function(err, contents) {
    // console.log(contents);
    console.log(contents);
});


// console.log();
// console.log();
// console.log();
// console.log('*************');

// var mylist = [];
// var myInterface = readline.createInterface({
//   input: fs.createReadStream(filedir)
// });

var lineno = 0;
myInterface.on('line', function (line) {
  lineno++;
  console.log('Line number ' + lineno + ': ' + line);
  mylist.push(line);
  if(lineno==6){
  	console.log("Print the data:");
  	console.log(mylist);
  }
});