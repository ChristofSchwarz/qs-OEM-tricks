const debugInfo = false;
const recycle = process.argv[2]=='true';  // true to delete allocations older than seven days
    // you can pass this as command-line argument when calling this node.js code
    // e.g.  node qrs-unallocate.js true
console.log('Operation mode: recycle allocations = ' + recycle);


var sevenDaysAgo = new Date(new Date().getTime()-(7*24*60*60*1000));
sevenDaysAgo = sevenDaysAgo.toISOString();

var https = require('https'); 
var fs = require('fs'); 
require('console.table');
//var request = require('request');
//var cmdLineArg1 = '' + process.argv[2];
//var cmdLineArg2 = '' + process.argv[3];
const serverUrl = 'qmi-qs-aai';
const xrfkey = Math.random().toString().replace('.','').repeat(4).substr(-16);
var options = { 
    rejectUnauthorized: false, 
    hostname: serverUrl, 
    port: 4242, 
    path: null,
    method: null, 
    headers: { 
        "X-Qlik-Xrfkey" : xrfkey
        ,"X-Qlik-User" : 'UserDirectory=Internal;UserId=sa_repository' 
    }, 
    key: fs.existsSync(".\\client_key.pem")?fs.readFileSync(".\\client_key.pem")
        :fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem"),
    cert: fs.existsSync(".\\client.pem")?fs.readFileSync(".\\client.pem")
        :fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem") 
}; 


// Generic call of qrsApi with return of a Promise
// Thanks to https://github.com/kreta99/QS_ScalTools_ext/blob/master/app_gen.js
// https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call

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


function consoleHeadline(txt) {
    console.log();
    console.log(('_').repeat(80));
    console.log();
    console.log(txt);
    console.log();
}

// *** Main Code ***

var taggedUsers = [];

qrsApi('GET', '/qrs/license/accesstypeoverview')  
.then(function(result){
    consoleHeadline('Overview of available access types');
    // result of /qrs/license/accesstypeoverview
    console.log('userAccess: ' + (!result.json.userAccess.enabled ?  'disabled' :
        result.json.userAccess.available + '/' + result.json.userAccess.total + ' available'));
    console.log('loginAccess: ' + (!result.json.loginAccess.enabled ?  'disabled' :
        result.json.loginAccess.available + '/' + result.json.loginAccess.total + ' available'));
    console.log('professionalAccess: ' + (!result.json.professionalAccess.enabled ?  'disabled' :
        result.json.professionalAccess.available + '/' + result.json.professionalAccess.total + ' available'));
    console.log('analyzerAccess: ' + (!result.json.analyzerAccess.enabled ?  'disabled' :
        result.json.analyzerAccess.available + '/' + result.json.analyzerAccess.total + ' available'));
    
    return qrsApi("GET", "/qrs/user/full?filter=tags.name%20eq%20'keepAllocation'");
})
.then(function(result){  
    consoleHeadline('The following users are tagged "keepAllocation"');
    result.json.forEach(e=>{
        console.log(e.userDirectory + '\\' + e.userId);
        taggedUsers.push(e.id);
    })
   
    return qrsApi ('GET', '/qrs/license/professionalaccesstype/full');
})
.then(async function(result){
    consoleHeadline('These users have Professional allocations:');
    
    var table = [];  // creating a table for console.table
    var promiseArr = [];
    result.json.forEach(function(elem) {
        table.push({ 
            userId: elem.user.userDirectory + '\\' + elem.user.userId
            ,lastUsed: elem.lastUsed.substr(0,19)
            ,allocation: (elem.quarantined? 'quarantine': 
                ((elem.lastUsed < sevenDaysAgo)? 'older 7d': 'within 7d'))
            ,tagged: taggedUsers.indexOf(elem.user.id)>=0
        });
        if (elem.lastUsed < sevenDaysAgo && !elem.quarantined 
            && recycle && taggedUsers.indexOf(elem.user.id)<0) {
            promiseArr.push(
                qrsApi('DELETE', `/qrs/license/professionalaccesstype/${elem.id}`, null
                ,'deallocated user ' + elem.user.userDirectory + '\\' + elem.user.userId)
            );
        };
    });
    console.table(table);
    
    //await Promise.all(promiseArr); // this would do the job but creates no output to console

    await Promise.all(promiseArr.map(prom => prom.catch(err => err)))
    .then(results => console.log(results)) // creates output to console
    .catch(err => console.log('Error', err));
    

    return qrsApi ('GET', '/qrs/license/analyzeraccesstype/full');
})
.then(async function(result){
    consoleHeadline('These users have Analyzer allocations:');
    
    var table = [];  // creating a table for console.table
    var promiseArr = [];
    result.json.forEach(function(elem) {
        table.push({ 
            userId: elem.user.userDirectory + '\\' + elem.user.userId
            ,lastUsed: elem.lastUsed.substr(0,19)
            ,allocation: (elem.quarantined? 'quarantine': 
                ((elem.lastUsed < sevenDaysAgo)? 'older 7d': 'within 7d'))
            ,tagged: taggedUsers.indexOf(elem.user.id)>=0
        });
        if (elem.lastUsed < sevenDaysAgo && !elem.quarantined 
            && recycle && taggedUsers.indexOf(elem.user.id)<0) {
            promiseArr.push(
                qrsApi('DELETE', `/qrs/license/analyzeraccesstype/${elem.id}`, null
                ,'deallocated user ' + elem.user.userDirectory + '\\' + elem.user.userId)
            );
        };
    });
    console.table(table);
    
    //await Promise.all(promiseArr); // this would do the job but creates no output to console

    await Promise.all(promiseArr.map(prom => prom.catch(err => err)))
    .then(results => console.log(results)) // creates output to console
    .catch(err => console.log('Error', err));
    
    consoleHeadline('Bye.');
})
.catch(function(err){
    console.error("Something went wrong.");
    console.error(err);
});

