const debugInfo = false;
var sevenDaysAgo = new Date(new Date().getTime()-(3*24*60*60*1000));
sevenDaysAgo = sevenDaysAgo.toISOString();
const recycle = true;  // true to delete allocations older than seven days

var https = require('https'); 
var fs = require('fs'); 
//var enigmajs = require('./enigma');
require('console.table');
//var request = require('request');
//var cmdLineArg1 = '' + process.argv[2];
//var cmdLineArg2 = '' + process.argv[3];
const serverUrl = 'qmi-qs-aai';
const xrfkey = '?xrfkey=1234567890123456';
var options = { 
    rejectUnauthorized: false, 
    hostname: serverUrl, 
    port: 4242, 
    path: null,
    method: null, 
    headers: { 
        "X-Qlik-Xrfkey" : xrfkey.substr(-16)
        ,"X-Qlik-User" : 'UserDirectory=Internal;UserId=sa_repository' 
    }, 
    //key: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem")
    key: fs.readFileSync(".\\client_key.pem"),
    //,cert: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem") 
    cert: fs.readFileSync(".\\client.pem") 
}; 

// https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises

function getAccessTypeOverview() {
    return new Promise(function(resolve, reject){
        options.path = `/qrs/license/accesstypeoverview` + xrfkey;
        options.method = 'GET';
        if (debugInfo) console.log(options.method + ' ' + options.path);

        var req = https.request(options, function(res) { 
            var chunks = [];
            if (debugInfo) console.log("Response Code: " + res.statusCode); 
            res.on('data', function(chunk) { 
                chunks.push(chunk);
            });
            res.on('end', function () {		
                var body = Buffer.concat(chunks);
                try {
                    var returnJson = JSON.parse(body);
                    if (debugInfo) console.log(returnJson);
                    
                    console.log('userAccess: ' + (!returnJson.userAccess.enabled ?  'disabled' :
                        returnJson.userAccess.available + '/' + returnJson.userAccess.total + ' available'));
                    console.log('loginAccess: ' + (!returnJson.loginAccess.enabled ?  'disabled' :
                        returnJson.loginAccess.available + '/' + returnJson.loginAccess.total + ' available'));
                    console.log('professionalAccess: ' + (!returnJson.professionalAccess.enabled ?  'disabled' :
                        returnJson.professionalAccess.available + '/' + returnJson.professionalAccess.total + ' available'));
                    //getAccessAssignments('professional', false);  // true to remove older allocations                    
                    console.log('analyzerAccess: ' + (!returnJson.analyzerAccess.enabled ?  'disabled' :
                        returnJson.analyzerAccess.available + '/' + returnJson.analyzerAccess.total + ' available'));
                    //getAccessAssignments('analyzer', false);  // true to remove older allocations    
                    resolve(returnJson);
                } 
                catch(err) { 
                    console.log ("Error, no JSON: " + body);
                    reject(''+body);
                }
            });
            res.on('error', function(e) { 
                console.log("Got error from https call:", e.message);
            });
        });	 
        req.end();	
    })    
}

function getAccessAssignments(licenseType, recycle) {
    return new Promise(function(resolve, reject) {     
        options.path = `/qrs/license/${licenseType}accesstype/full` + xrfkey;
        options.method = 'GET';
        var sevenDaysAgo = new Date(new Date().getTime()-(7*24*60*60*1000));
        sevenDaysAgo = sevenDaysAgo.toISOString();

        var req = https.request(options, function(res) { 
            var chunks = [];
            if (debugInfo) console.log("Response Code: " + res.statusCode); 
            res.on('data', function(chunk) { 
                chunks.push(chunk);
            });
            res.on('end', function () {		
                var body = Buffer.concat(chunks);
                try {
                    var returnJson = JSON.parse(body);
                    if (debugInfo) console.log(returnJson);
                    var table = [];
                    console.log(licenseType + ' licenses:');
                    returnJson.forEach(function(elem) {
                        table.push({ 
                            id: elem.id
                            ,userId: elem.user.userDirectory + '\\' + elem.user.userId
                            ,lastUsed: elem.lastUsed
                            ,allocation: (elem.quarantined? 'quarantine': ((elem.lastUsed < sevenDaysAgo)? 'older 7d': 'within 7d'))
                        });
                        if (elem.lastUsed < sevenDaysAgo && !elem.quarantined && recycle) {
                            delLicenseAssignment(licenseType, elem.id);
                        };
                    });
                    console.table(table);
                    resolve(returnJson);
                } 
                catch(err) { 
                    console.log ("Error, no JSON: " + body);
                    reject(''+body);
                }
            });
            res.on('error', function(e) { 
                console.error("Got error from https call:", e.message);
                reject(e);
            });
        });	 
        req.end();	
    })    
}


function delLicenseAssignment(licenseType, assignmentId){
    options.path = `/qrs/license/${licenseType}accesstype/${assignmentId}` + xrfkey;
    options.method = 'DELETE';
    if (debugInfo) console.log(options.method + ' ' + options.path);

    var req = https.request(options, function(res) { 
        var chunks = [];
		if (debugInfo) console.log("Response Code: " + res.statusCode); 
		res.on('data', function(chunk) { 
            chunks.push(chunk);
        });
        res.on('end', function () {		
            console.log('' + Buffer.concat(chunks));
            console.log(`license ${assignmentId} was anallocated`);
        });
        res.on('error', function(e) { 
            console.log("Got error from https call:", e.message);
        });
    });	 
    req.end();	
}

// Generic call of qrsApi with return of a Promise
// Thanks to https://github.com/kreta99/QS_ScalTools_ext/blob/master/app_gen.js
// https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call

function qrsApi(method, path, sendJson){    
    return new Promise(function(resolve, reject) {     
        options.path = path + xrfkey;
        options.method = method;
        var resultObj = { statusCode: null };
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
                    resolve(resultObj);
                } 
                catch(err) { 
                    if (body.length > 0) { resultObj.body = '' + body };
                    if (res.statusCode >= 400) { reject(resultObj) } 
                    else { resolve(resultObj) }
                }
            });
            res.on('error', function(e) { 
                //console.error("Got error from https call:", e.message);
                resultObj.body = e.message;
                reject(resultObj);
            });
        });	 
        if (sendJson) req.write(JSON.stringify(sendJson));
        req.end();	
    })       
}



// *** Main Code ***

qrsApi('GET', '/qrs/about')  // just a warm-up, getting Sense Version
.then(function(result){
    console.log(result.json);
    return getAccessTypeOverview();
                          
}).then(function(result){  
    return getAccessAssignments('professional', recycle);  // true to remove older allocations
}).then(function(result){  
    return getAccessAssignments('analyzer', recycle);      
}).then(function(result){
    console.log('Bye.');
}).catch(function(err){
    console.error("Something went wrong.");
    console.error(err);
});

