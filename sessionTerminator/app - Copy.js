// By Christof Schwarz
// v0.8 ; 15-04-2020 
// this app gets all active sessions of a given virtual proxy (QPS API)
// and when the latestActivity of that session happened (QRS API).
// When a commandline argument is present (a number e.g. 4) than
// the "oldest" sessions of the same user exceeding that number will be
// terminated. "oldest" session is that one where the latest activity is
// the farest past.

const qrsPort = 4242;
const qpsPort = 4243;
const serverUrl = 'localhost'; //'qmi-qs-sn';

const debugInfo = false;  // true .. show additional console.log

var https = require('https'); 
var fs = require('fs'); 
require('console.table');

var cmdLineArg1 = process.argv[2];
console.log('\n--- Qlik Session Terminator by Christof Schwarz ---\n');

if (cmdLineArg1 == undefined) {
    cmdLineArg1 = 9999;
} else {
    console.log('Command Line Argument provided.');
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
    }, 
    // certificates are taken from the same folder as this app.js file
    // but if missing it looks for the default certificates found under C:\ProgramData...
    key: fs.existsSync(".\\client_key.pem")?fs.readFileSync(".\\client_key.pem")
        :fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem"),
    cert: fs.existsSync(".\\client.pem")?fs.readFileSync(".\\client.pem")
        :fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem") 
}; 



function qApi(method, path, requestBody, returnMsg){    

    // Generic function to talk to Qlik Sense QRS of QPS API and return a promise.
    
    // It takes 2-4 params:
    // method: 'GET', 'POST', 'PUT', 'DELETE' ...
    // path: endpoint starting with '/qrs/...' or '/qps/...' 
    //     Note: don't add the obligatory "xrfkey=..." parameter, this is done for you
    // sendJson (optional): a requestBody to be sent (for some POST, PUT ... requests)
    // returnMsg: a text be returned when the Promise resolves (instead of an object)
    
    // response: is an object with following keys:
    // { statusCode: ###, path: "xxx", json: {...} or [] }
    
    // Both QRS and QPS apis have Json responses, so the result is already parsed from
    // string into Json.
    
    return new Promise(function(resolve, reject) {     
        if (path.indexOf('qps')==1) {
            options.port = qpsPort;
            options.headers["X-Qlik-User"] = 'UserDirectory=Internal;UserId=sa_proxy';
        } else if (path.indexOf('qrs')==1) {
            options.port = qrsPort;
            options.headers["X-Qlik-User"] = 'UserDirectory=Internal;UserId=sa_repository'; 
        } else {
            reject('Endpoint is neither /qrs nor /qps: ' + path);
        }
        var resultObj = { statusCode: null, path : path };
        options.path = path + (path.indexOf('?')>=0 ? '&xrfkey=' : '?xrfkey=') + xrfkey;
        options.method = method;
        var req = https.request(options, res=> { 
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

qApi('GET', '/qrs/license/analyzeraccessusage/full')
.then(res => {
    // get session info from QRS license usage endpoint (Analyzers)
    //console.log('Analyzers:', res);
    res.json.forEach(si=>{
        
        var usr = si.modifiedByUserName;
        if (!users.hasOwnProperty(usr)) users[usr]={};
        users[usr][si.sessionID]={};
        users[usr][si.sessionID].license = 'analyzer';
        users[usr][si.sessionID].latestActivity = si.latestActivity;
        
    });    
    return qApi('GET', '/qrs/license/professionalaccessusage/full');
})
.then(res => {
    // get session info from QRS license usage endpoint (Professionals)
    //console.log('Professionals', res);
    res.json.forEach(si=>{
        var usr = si.modifiedByUserName;
        if (!users.hasOwnProperty(usr)) users[usr]={};
        users[usr][si.sessionID]={};
        users[usr][si.sessionID].license = 'professional';
        users[usr][si.sessionID].latestActivity = si.latestActivity;
    });
    
    return qApi('GET', '/qrs/virtualproxyconfig');
})
.then(async vproxyConf => {    

    // Get a list of all sessions on all virtual proxies using the QPS API.
    // This time, some new sessions may show, such ones who do not consume a
    // license (e.g. admins logged in)
    // To get this, a promise array of all qps calls is constructed and awaited.
    // The array is constructed based on the result of the previous call, which
    // was /qrs/virtualproxyconfig
    
    promiseArr = [qApi('GET', '/qps/session')];  // sessions of default proxy
    vproxyConf.json.forEach(vproxy => {
       if (vproxy.prefix.length > 0) {
           promiseArr.push(qApi('GET', `/qps/${vproxy.prefix}/session`));
       }
    })
    await Promise.all(promiseArr.map(prom => prom.catch(err => err)))
    .then(results => {
        results.forEach(res => {
            if (res.json.length > 0) {
                //console.log(res);
                res.json.forEach(sess => {
                    sessions[sess.SessionId] = {};
                    sessions[sess.SessionId].user = sess.UserDirectory + '\\' + sess.UserId;
                    sessions[sess.SessionId].vpxy = res.path.substr(4).substr(0,res.path.length-4-7);
                })
            }
        });
        
        // find session age sequence for each user
        // store the result into sessions[] array as .seq key
        for (user in users) {
            var oldestSess
            var oldestSessDate
            var sortOrder = []
            for (sessId in users[user]) {
                if (!sessions.hasOwnProperty(sessId)) {
                    sessions[sessId] = {};
                    sessions[sessId].user = user;
                }
                sessions[sessId].latestActivity = users[user][sessId].latestActivity;
                sessions[sessId].license = users[user][sessId].license;
                sortOrder.push(users[user][sessId].latestActivity + '|' + sessId);
            };
            sortOrder.sort(); //sort ascending
            sortOrder.reverse(); //sort descending
            sortOrder.forEach((entry,i)=>{
                sessions[entry.split('|')[1]].seq = i+1;
            });
        }
        if (debugInfo) console.log('sessions:', sessions);
        if (debugInfo) console.log('users:', users);

        // final processing: delete the oldest session for each user
        
        var table = []; // creating a table for summary output on console
        for (sessId in sessions){
            table.push({
                session: [sessId],
                user: sessions[sessId].user,
                vpxy: sessions[sessId].vpxy || '',
                license: sessions[sessId].license,
                latestActivity: sessions[sessId].latestActivity,
                seq: sessions[sessId].seq
            });
            
            if ((sessions[sessId].seq > cmdLineArg1 && sessions[sessId].vpxy) 
            || (cmdLineArg1 != 9999 && sessions[sessId].latestActivity === undefined)) {
                qApi('DELETE', `/qps${sessions[sessId].vpxy}session/${sessId}`, 
                null, `Terminated session ${sessId} of user ${sessions[sessId].user}`)
                .then(res => console.log(res))
                .catch(err => console.log(err));
            }
        }
        if (table.length == 0) {
            console.log('No sessions found.');
        } else {
            console.table(table);
        }


    }) 
    .catch(err => {console.log('Error', err)});
    
})
.catch(function(err){
    console.error("Something went wrong.");
    console.error(err);
});

