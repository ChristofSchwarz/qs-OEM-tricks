// Uses three modules
// npm install https express fs;
const https = require('https');
const express = require('express');
const fs = require('fs');
var app = express();
const defaultCertPath = 'C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates';
const xrfkey = Math.random().toString().replace('.','').repeat(4).substr(-16);

var httpOptions = {
	host: null,
	port: null,
	path: null,
	method: 'POST',
	headers: {
		"X-Qlik-Xrfkey": xrfkey
		,"Content-Type": 'application/json'
		,"X-Qlik-User" : 'UserDirectory=Internal;UserId=sa_repository'
	},
	key: fs.existsSync(".\\client_key.pem")?fs.readFileSync(".\\client_key.pem")
		:fs.readFileSync(defaultCertPath + "\\client_key.pem"),
	cert: fs.existsSync(".\\client.pem")?fs.readFileSync(".\\client.pem")
		:fs.readFileSync(defaultCertPath + "\\client.pem"), 
	//passphrase: options.PassPhrase,
	rejectUnauthorized: false,
	agent: false
};

app.get('/', function(req, res) {
	res.send("minimalistic Qlik-Ticket-integration is up.");
	//console.log(req);
});	
app.get('/login', function(req, res) {
	console.log('incoming', req.originalUrl);
	if (req.query.targetId == undefined || req.query.proxyRestUri == undefined) {
		res.send('Error: Querystrings targetId or proxyRestUri are missing');
	} else {
		
		var proxyRestUri = req.query.proxyRestUri;
		// returns: 'https://senseserver.company.com:4243/qps/vproxy/'
		httpOptions.host = proxyRestUri.split('//')[1].split('/')[0].split(':')[0];
		// returns:  'senseserver.company.com'
		httpOptions.port = Number(req.query.proxyRestUri.split('//')[1].split('/')[0].split(':')[1] || "4243"); 
		// returns: 4243
		httpOptions.path = req.query.proxyRestUri.substring(req.query.proxyRestUri.indexOf('/',8))
			+ 'ticket?xrfkey=' + xrfkey;
		// returns: '/qps/vproxy/ticket?xrfkey=xxxxxxxxxxxxxxxx'
		console.log('Posting ticket request to QPS API:');
		console.log('host', httpOptions.host);
		console.log('port', httpOptions.port);
		console.log('path', httpOptions.path) ;
		
		var ticketreq = https.request(httpOptions, function (ticketres) {
            ticketres.on('data', function (d) {
                //Parse ticket response
                try {
                    var ticket = JSON.parse(d.toString());
					console.log('QPS response:', ticket);
                } catch(e) {
                    res.end('Invalid request JSON');
                    return;
                }

                //Build redirect including ticket
                redirectURI = ticket.TargetUri + ((ticket.TargetUri.indexOf("?")>=0)?'&':'?')
					+ 'QlikTicket=' + ticket.Ticket;
				console.log('redirectURI',redirectURI);
                res.writeHead(302, {'Location': redirectURI});
                res.end();
            });
        });
		
		//Send JSON request for ticket
        var jsonrequest = {
            UserDirectory: 'WHATEVER',
            UserId: 'beloved.user',
            Attributes: [{"Group": 'ExampleGroup'}],
            TargetId: req.query.targetId
        };
        ticketreq.write(JSON.stringify(jsonrequest));
        ticketreq.end();

        ticketreq.on('error', function (e) {
            res.end(e.toString());
        });
		
		//res.send(`Minimalistic Qlik-Ticket-integration is here.`);
	}
});	

console.log('listening to port 3000'); 
app.listen(3000);
