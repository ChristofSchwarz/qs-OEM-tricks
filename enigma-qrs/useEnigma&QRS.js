
// Using certificates to authenticate against Qlik Sense server
// two different APIs are used:
// - Enigma (Engine API wrapper), websockets via port 4747
// - QRS (Repository Service API), https via port 4242

const myApp = '1c5d59ef-fecd-43c9-9d3d-8d7598cab403';
const qsUrl = 'qmi-qs-ml';
const enigma = require('./node_modules/enigma.js/enigma.min.js');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const schema = require('./node_modules/enigma.js/schemas/12.170.2.json'); 
// match this schema to your Qlik Sense version.
const defaultCertPath = 'C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates';
const xrfkey = Math.random().toString().replace('.','').repeat(4).substr(-16);

var options = { 
    rejectUnauthorized: false, 
    hostname: qsUrl, 
    port: 4242, 
    path: null,
    method: null, 
    headers: { 
        "X-Qlik-Xrfkey" : xrfkey
        ,"X-Qlik-User" : 'UserDirectory=Internal;UserId=sa_repository' 
    }, 
    key: fs.existsSync(".\\client_key.pem")?fs.readFileSync(".\\client_key.pem")
        :fs.readFileSync(defaultCertPath + "\\client_key.pem"),
    cert: fs.existsSync(".\\client.pem")?fs.readFileSync(".\\client.pem")
        :fs.readFileSync(defaultCertPath + "\\client.pem") 
}; 

var session = enigma.create({
    schema,
    url: `wss://${qsUrl}:4747/app/engineData`,
    createSocket: url => new WebSocket(url, {
        rejectUnauthorized: false,  
        //ca: [fs.readFileSync('.\\root.pem')],  // you can skip ca if you set rejectUnautzoried to false
        key: fs.existsSync(".\\client_key.pem")?fs.readFileSync(".\\client_key.pem")
            :fs.readFileSync(defaultCertPath + "\\client_key.pem"),
        cert: fs.existsSync(".\\client.pem")?fs.readFileSync(".\\client.pem")
            :fs.readFileSync(defaultCertPath + "\\client.pem"),
        headers: {
            // this impersonates any user! 
            "X-Qlik-User": 'UserDirectory=INTERNAL;UserId=sa_engine'
        }
    })
});

function qrsApi(method, path, requestBody, returnMsg){    
    // Generic function to talk to Qlik Sense QRS API and return a promise.
    // It takes 2-4 params:
    // method: 'GET', 'POST', 'PUT', 'DELETE' ...
    // path: qrs endpoint starting with '/qrs/...' (don't add "xrfkey=...")
    // sendJson (optional): a requestBody to be sent (for some POST, PUT ... requests)
    // returnMsg: a text be returned when the Promise resolves (instead of an object)

    return new Promise(function(resolve, reject) {     
        options.path = path + (path.indexOf('?')>=0?'&xrfkey=':'?xrfkey=') + xrfkey;
        options.method = method;
        var resultObj = { statusCode: null }; //, path: options.path };
        var req = https.request(options, function(res) { 
            var chunks = [];
            resultObj.statusCode = res.statusCode; 
            res.on('data', function(chunk) { 
                chunks.push(chunk);
            });
            res.on('end', function () {		
                var body = Buffer.concat(chunks);
                try {
                    resultObj.json = JSON.parse(body);
                    resolve(returnMsg?returnMsg:resultObj);
                } 
                catch(err) { 
                    if (body.length > 0) { resultObj.body = '' + body };
                    if (res.statusCode >= 400) { reject(resultObj) } 
                    else { resolve(returnMsg?returnMsg:resultObj) }
                }
            });
            res.on('error', function(e) { 
                //console.error("Got error from https call:", e.message);
                resultObj.body = e.message;
                reject(resultObj);
            });
        });	 
        if (requestBody) req.write(JSON.stringify(requestBody));
        req.end();	
    })       
}


session.open().then(function (global) {
    var app;
    console.log('Session was opened successfully');
    //console.log(global);
    return global.engineVersion().then(ret => {
        console.log(ret);
        return qrsApi("POST", `/qrs/app/${myApp}/copy`);
    }).then(qrsRet => {
        console.log('New app: ', qrsRet.json.id);
        //return app.doSave();
        return global.openDoc({"qDocName": qrsRet.json.id, "qNoData": true});
    }).then(ret => {
        app = ret;
        return app.getScript();
    }).then(script => {
        //console.log(script);
        script = script.replace('$tab Main','$tab Main\n//Enigma was here!');
        return app.setScript(script);
    }).then(ret => {
        console.log('app script changed:', ret);
        return app.doSave();        
    }).catch(error => {
        console.error('Error', error);
    });
}).then(ret => {
    session.close();
}).catch(error => {
    console.error('Error', error);
});

