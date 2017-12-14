/*
    @license

    The MIT License (MIT)

    Copyright (c) 2018 Christian Adam <christian.g.adam@gmail.com>

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

const url = require('url'),
    http = require('http'),
    PORT = 9000;

console.log(`[LOCAL-SERVER] - Local server listening to ${PORT}`);

console.log('\nWELCOME TO THE DEMO!');
console.log('********************');

console.log('Run local-mitm in this folder:');
console.log('- local-mitm');

console.log('Do the following GET requests in a browser to understand how this works!:');
console.log('- http://localhost:9000/?name=Pedro // Original server, original response');
console.log('- http://localhost:9001/?name=Pedro // MITM server, original response');
console.log('- http://localhost:9000/?name=Matias // Original server, original response');
console.log('- http://localhost:9001/?name=Matias // MITM server, hardcoded response');

http.createServer(function (req, res) {
    let parsedUrl = url.parse(req.url, true);
    let name = parsedUrl.query.name;
    let greetingTo = 'World';
    if(name){
        greetingTo = name;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(`Hello ${greetingTo}!`);
    res.end();
}).listen(PORT);
  