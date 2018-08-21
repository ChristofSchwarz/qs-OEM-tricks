/*
based on work by Fredrik Lautrup (2015), Jeffrey Goldberg (2015)

*/

var https = require('https');
//var http = require('http');
var express = require('express');
var fs = require('fs');
//var url_module = require('url');

var session_module = require('express-session');
var body_parser = require('body-parser');
var cookie_parser = require('cookie-parser');

var app = express();

//set the port for the listener here
app.set('port', 8190);

// common options for the QRS API
var QPSAPI = {
    host: '' + process.argv[2], //"qmi-qs-madrid",
    protocol: "https:", // end with ":
    port: parseInt(process.argv[3]), //4243,    
    //pfx: fs.readFileSync('client.pfx'),
    //passphrase: 'test',
    key: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem"),
    cert: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem"),
    rejectUnauthorized: false,
    agent: false
};

//console.log ('Using Config: ', QPSAPI);

//var RESTURI = "https://qmi-qs-cln:4243/qps/myvirtualproxy";


//Generates a random number that we use as the session token
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
};

function generateXrfKey() {
    var d = new Date().getTime();
    var xrfkey = 'aaaaaaaaaaaaaaaa'.replace(/a/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'a' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return xrfkey;
};


//New Expressjs 4.x notation for configuring middleware components
//app.use(session_module({ resave: true, saveUninitialized: true, secret: 'uwotm8' }));
app.use(cookie_parser('Test'));
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));


app.get('/', function (req, res) {
      //Return HTML page
      //console.log("Send login page");
      //res.sendfile('info.htm');
      res.send("<HTML><HEAD></HEAD><BODY>You are not using this module in the right way.</BODY><HTML>");      
 });

 
//Create endpoint for login
// example: https://qmi-qs-cln:8190/login?usr=toscafan&dir=TEASER&goto=/sense/app/f1252188-6bdc-45f6-95f0-efaf1f602b7a
// example: https://qmi-qs-cln:8190/login?usr=toscafan&dir=TEASER
app.get('/login', function (req, res) {

    var p = req.query.p;  // read querystring "p" from url
    var z = req.query.z;
    var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    if(!p || !z || !base64regex.test(p) || !base64regex.test(z)) {
        res.send("Missing relevant querystrings.");          
    } else {
        var usr = Buffer.from(p, 'base64').toString();
        usr = usr.split(String.fromCharCode(0)).join('');  // remove char(0)
        var dir = Buffer.from(z, 'base64').toString();
        dir = dir.split(String.fromCharCode(0)).join(''); // remove char(0)
        var goto = req.query.goto || '/hub';
            
        console.log("Create session for user " + dir + "\\" + usr);
        //Create session for the user and user directory    
        //Configure parameters for the ticket request
        var xrfkey = generateXrfKey();
        var options = Object.assign (QPSAPI,  //Object.assign merges 2 objects
            {
                path: '/qps/session?xrfkey=' + xrfkey,
                method: 'POST',
                headers: { "x-qlik-xrfkey": xrfkey, "Content-Type": 'application/json' },
            });
        console.log(options.method, options.path.toString());
        //Send request to create session
        var sessionreq = https.request(options, function (sessionres) {
            console.log("statusCode: ", sessionres.statusCode);

            sessionres.on('data', function (d) {
                //Parse response
                var session = JSON.parse(d.toString());
                console.log('got session ' + session.SessionId);
                res.set('Content-Type', 'text/html');
                res.cookie('X-Qlik-Session', session.SessionId, { expires: 0, httpOnly: true });
                //res.redirect(QPSAPI.protocol + "//" + QPSAPI.host + goto);
                res.send("<html><head></head><body>"
               // + "<script>window.location='/redirect?goto=" + goto + "';</script>" 
                + "Session " + session.SessionId +" created for user "+ session.UserId 
                + "<br/>Go to <a href='" + QPSAPI.protocol + "//" + QPSAPI.host + goto
                + "' target='_new'>Hub</a> or <a href='/logout'>Logout</a> the session."
                + "</body></html>");
                
            });
        });

        //Send JSON request for session
        var jsonrequest = JSON.stringify(
            { "UserDirectory": dir.toString(), 
              "UserId": usr.toString(), 
              "SessionId": generateUUID(),
              "Attributes": [{"option": 'qpslogin'}]
            }
        );
        
        sessionreq.write(jsonrequest);
        sessionreq.end();

        sessionreq.on('error', function (e) {
            console.error('Error' + e);
        });    
    }

});

//Create endpoint for logout
// example: https://qmi-qs-cln:8190/logout
app.get('/logout', function (req, res) {

    var xrfkey = generateXrfKey();
    var options = Object.assign (QPSAPI,  // Object.assign merges 2 objects
        {
            path: '/qps/session/' + req.cookies['X-Qlik-Session']+'?xrfkey=' + xrfkey,
            method: 'DELETE',
            headers: { "x-qlik-xrfkey": xrfkey, "Content-Type": 'application/json' },
        });
    

    console.log(options.method, options.path.toString());
    //Send request to get logged out
    var sessionreq = https.request(options, function (sessionres) {
        console.log("statusCode: ", sessionres.statusCode);
      
        sessionres.on('data', function (d) {
            var session = JSON.parse(d.toString());

            console.log(session.Session.UserId + " is logged out from session " + session.Session.SessionId);
            res.clearCookie('X-Qlik-Session');
            res.send("<HTML><HEAD></HEAD><BODY>" + session.Session.UserId 
                + " is logged out. " // + session.Session.SessionId + "<BR><a href=' / '>Back to start page</a>
                + "</BODY><HTML>");
        });
        
    });

    //Send request to logout
    sessionreq.end();

    sessionreq.on('error', function (e) {
        console.error('Error' + e);
    });    
    
});

//Create endpoint for user information
// example: https://qmi-qs-cln:8190/info
app.get('/info', function (req, res) {
    // Uses the session API to request information about the current user
    //Configure parameters for the user information request
    var xrfkey = generateXrfKey();
    var options = Object.assign (QPSAPI,  // Object.assign merges 2 objects
        {
            path: '/qps/session/' + req.cookies['X-Qlik-Session']+'?xrfkey=' + xrfkey,
            method: 'GET',
            headers: { "x-qlik-xrfkey": xrfkey, "Content-Type": 'application/json' },
        });

    console.log(options.method, options.path.toString());
    //Send request to get information about the user
    var sessionreq = https.request(options, function (sessionres) {
        console.log("statusCode: ", sessionres.statusCode);
     
        sessionres.on('data', function (d) {
            if(d.toString()!="null" && req.cookies['X-Qlik-Session'] !== undefined ) {
                var session = JSON.parse(d.toString());

                console.log(session.UserId + " is using session " + session.SessionId);
                res.send("<HTML><HEAD></HEAD><BODY>" + session.UserId + " is using session " + session.SessionId + "</BODY><HTML>");
            } else {
                res.send("<HTML><HEAD></HEAD><BODY>No active user</BODY><HTML>");
            }
        });

    });

    //Send request 
    sessionreq.end();

    sessionreq.on('error', function (e) {
        console.error('Error' + e);
    });

});



//Server options to run an HTTPS server
var httpsoptions = {
    //pfx: fs.readFileSync('server.pfx'),
    //passphrase: 'test'
    key: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem"),
    cert: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem") 
};

//Start listener
var server = https.createServer(httpsoptions, app);
//var server = http.createServer(app);
server.listen(app.get('port'), function()
    {
        console.log('Express server listening on port ' + app.get('port') 
        + '. Press Ctrl+C to stop.');
    });
