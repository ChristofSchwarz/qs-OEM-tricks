// By Christof Schwarz
// v0.7 ; 15-04-2020 
// this app gets all active sessions of a given virtual proxy (QPS API)
// and when the latestActivity of that session happened (QRS API).
// When a commandline argument is present (a number e.g. 4) than
// the "oldest" sessions of the same user exceeding that number will be
// terminated. "oldest" session is that one where the latest activity is
// the farest past.

const qrsPort = 4242;
const qpsPort = 4243;
const serverUrl = 'qmi-qs-sn';
var virtualProxy = ''; // if default vproxy set to '', otherwise end with a '/' like 'header/'
// var virtualProxy = 'header/'

const debugInfo = false;  // true .. show additional console.log

var https = require('https'); 
var fs = require('fs'); 
require('console.table');

var cmdLineArg1 = process.argv[2];
console.log('\n--- Qlik Session Terminator by Christof Schwarz ---\n');        
if (cmdLineArg1 == undefined) {
    cmdLineArg1 = 9999;
} else {
    console.log(`Command Line Argument provided.`);
    console.log(`-> delete oldest session(s) if a user has more than ${cmdLineArg1} sessions.\n`);
}

const xrfkey = Math.random().toString().replace('.','').repeat(4).substr(-16);
var options = { 
    rejectUnauthorized: false, 
    hostname: serverUrl, 
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

function qApi(method, path, requestBody, returnMsg){    
    // Generic function to talk to Qlik Sense QRS of QPS API and return a promise.
    // It takes 2-4 params:
    // method: 'GET', 'POST', 'PUT', 'DELETE' ...
    // path: endpoint starting with '/qrs/...' or '/qps/...' (don't add "xrfkey=...")
    // sendJson (optional): a requestBody to be sent (for some POST, PUT ... requests)
    // returnMsg: a text be returned when the Promise resolves (instead of an object)
    
    return new Promise(function(resolve, reject) {     
        if (path.indexOf('qps')==1) {
            options.port = qpsPort;
        } else if (path.indexOf('qrs')==1) {
            options.port = qrsPort;
        } else {
            reject('Endpoint is neither /qrs nor /qps: ' + path);
        }
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



// *** Main Code ***

var sessions={};
var users={};

qApi('GET', `/qps/${virtualProxy}session`)
.then(function(res){
    // get a list of all sessions on a given virtual proxy
    // fill two objects, one by session (sessions) and one by user (users)
    //console.log(res);
    res.json.forEach(sess=>{
        var fullUsername = sess.UserDirectory + '\\' + sess.UserId;
        sessions[sess.SessionId] = {user: fullUsername};
        if (!users.hasOwnProperty(fullUsername)) users[fullUsername] = [];
        users[fullUsername][sess.SessionId]={};
    });
    //console.log('Active Sessions:');
    //console.log(sessions);
    return qApi('GET', `/qrs/license/analyzeraccessusage/full`);
})
.then(function(res){
    // get session info from QRS license usage endpoint (Analyzers)
    //console.log('Analyzers:', res);
    res.json.forEach(si=>{
        if (sessions.hasOwnProperty(si.sessionID)) {
            var usr = sessions[si.sessionID].user;
            sessions[si.sessionID].license = 'analyzer';
            sessions[si.sessionID].latestActivity = si.latestActivity;
            users[usr][si.sessionID].license = 'analyzer';
            users[usr][si.sessionID].latestActivity = si.latestActivity;
        }
    });    
    return qApi('GET', `/qrs/license/professionalaccessusage/full`);
})
.then(function(res){
    // get session info from QRS license usage endpoint (Professionals)
    //console.log('Professionals', res);
    res.json.forEach(si=>{
        if (sessions.hasOwnProperty(si.sessionID)) {
            var usr = sessions[si.sessionID].user;
            sessions[si.sessionID].license = 'professional';
            sessions[si.sessionID].latestActivity = si.latestActivity;
            users[usr][si.sessionID].license = 'professional';
            users[usr][si.sessionID].latestActivity = si.latestActivity;
        }
    });
    
    // find oldest session for each user
    for (user in users) {
        var oldestSess
        var oldestSessDate
        var sortOrder = []
        for (sessId in users[user]) {
            sortOrder.push(users[user][sessId].latestActivity + '|' + sessId);
        };
        sortOrder.sort(); //sort ascending
        sortOrder.reverse(); //sort descending
        sortOrder.forEach((entry,i)=>{
            sessions[entry.split('|')[1]].seq = i+1;
        });
        //console.log('oldest sess ' + oldestSess + ' ' + oldestSessDate);
    }
    
    if (debugInfo) console.log('sessions', sessions);
    if (debugInfo) console.log('users:', users);
    
    // final processing: delete the oldest session for each user
    
    var table = []; // creating a table for summary output on console
    for (sessId in sessions){
        table.push({
            session: [sessId],
            user: sessions[sessId].user,
            license: sessions[sessId].license,
            latestActivity: sessions[sessId].latestActivity,
            seq: sessions[sessId].seq
        });
        if (cmdLineArg1 != 'undefined' && sessions[sessId].seq > cmdLineArg1) {
            qApi('DELETE', `/qps/${virtualProxy}session/${sessId}`, 
            null, `Terminated session ${sessId} of user ${sessions[sessId].user}`)
            .then(res => console.log(res));
        }
    }
    console.table(table);
})
.catch(function(err){
    console.error("Something went wrong.");
    console.error(err);
});

