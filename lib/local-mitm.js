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

const http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    fs = require('fs'),
    app = connect(),
    path = require('path'),
    CONFIG_FILE = path.resolve(process.env['LOCAL_MITM_CONFIG'] ? process.env['LOCAL_MITM_CONFIG'] : path.join(process.cwd(), 'config.json')),
    RULES_FILE = path.resolve(process.env['LOCAL_MITM_RULES_FILE'] ? process.env['LOCAL_MITM_RULES_FILE'] : path.join(process.cwd(), 'rules.json')),
    config = require(CONFIG_FILE),
    RULES = getRules(),
    bodyParser = require('body-parser'),
    packageJson = require('../package.json'),
    TARGET = `${config.target.host}:${config.target.port}`;

let MITM_ID = 0;

console.log(`[LOCAL-MITM] - Version: ${packageJson.version}`);
console.log(`[LOCAL-MITM] - Using config file located at ${CONFIG_FILE}`);
console.log(`[LOCAL-MITM] - Using rules file located at ${RULES_FILE}`);
console.log(`[LOCAL-MITM] - Target: ${TARGET}`);

/**
* Returns a harcoded response for a given URL in case a harcoded
* response is configured for the given path.
* 
* @param {string} reqPath The path to check wether a harcoded response should
*                         be provided or not.
* @returns {object} The actual harcoded response or null if there's no harcoded 
*                   response.
*/
function getRule(reqPath) {
    let ruleResult = {
        statusCode: null,
        response: null
    }
    for (let i = 0; i < RULES.length; i++) {
        let rule = RULES[i];
        if(rule.regexp){
            if ((new RegExp(rule.regexp)).test(reqPath)) {
                ruleResult = rule;
                break;
            }
        }
    }
    return ruleResult;
}

/**
* Returns the rules that should be applied.
* @returns {object} The rules
*/
function getRules() {
    return JSON.parse(fs.readFileSync(RULES_FILE).toString());
}

app.use(bodyParser.json());

app.use(function(req, res, next){
    req.mitmId = ++MITM_ID;
    next();
});

app.use(function (req, res, next) {
    var body = req.body ? JSON.stringify(req.body, null, 2) : 'No Body';
    console.log(`[REQUEST]\n - MITM-ID: ${req.mitmId}\n - Method: ${req.method}\n - Path: ${req.url}\n - Headers:\n${JSON.stringify(req.headers, null, 2)}\n - Body:\n${body}\n`);
    var _write = res.write;
    let harcodedResponse =  getRule(req.url).response;
    let calledWriteOnce = false;
    let completeResponse = '';

    function logResponse(req, res, completeResponse, msgType) {
        let logMsg = `[RESPONSE: ${msgType}]\n - MITM-ID: ${req.mitmId}\n - Method: ${req.method}\n - Path: ${req.url}\n - StatusCode: ${res.statusCode}\n - Status Message: ${res.statusMessage}\n - Headers:\n${JSON.stringify(res._headers, null, 2)}\n - Content:\n%s\n`;
        let dataLog = completeResponse;
        if(res._headers['content-type'] === 'application/json'){
            try {
                dataLog = dataLog.replace(/\n/g,'').replace(/\r/g,'');
                /* For the sake of readability, parse (if parseable) */
                dataLog = JSON.stringify(JSON.parse(dataLog), null, 2);
            }
            catch (err) {
                /* Do nothing. The response is just not parseable to JSON (Maybe an error on the API side ?) */
            }
        }
        console.log(logMsg, dataLog);
    }

    res.write = function (data) {

        let writeData = data.toString();

        if (harcodedResponse) {
            if (!completeResponse) {
                writeData = JSON.stringify(harcodedResponse);
                completeResponse = writeData;
                _write.call(res, writeData);
            } else {
                //Do nothing on purpose. Just omit the second chunk as the response is only one and it's hardcoded
            }
        } else {
            // Write the data in whatever number of chunks it comes
            _write.call(res, writeData);
            completeResponse += writeData;
        }
    }

    res.on('finish', function () {
        let msgType = 'ORIGINAL';
        if (harcodedResponse) {
            msgType = 'HARDCODED';
        }
        logResponse(req, res, completeResponse, msgType);
    });

    next();
});

const proxy = httpProxy.createProxyServer({
    target: TARGET,
    changeOrigin: true
},
    function (err) {
        console.log(err);
    });

proxy.on('proxyReq', function (proxyReq, req, res, options) {
    if (req.body) {
        let bodyData = JSON.stringify(req.body);
        if(!proxyReq.headersSent) {
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        }
        proxyReq.write(bodyData);
    }
});

proxy.on('proxyRes', function (proxyRes, req, res) {
    let harcodedResponse = getRule(req.url).response;
    if (harcodedResponse) {
        proxyRes.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(harcodedResponse));
    }
    let hardcodedStatusCode = getRule(req.url).statusCode;
    if(hardcodedStatusCode){
        proxyRes.statusCode = hardcodedStatusCode;
    }
});

app.use(function (req, res) {
    proxy.web(req, res);
});

module.exports = {
    app: app,
    config: config
}