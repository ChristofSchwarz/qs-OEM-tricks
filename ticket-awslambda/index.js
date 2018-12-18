const https = require('https');
const fs = require('fs');
const xrfkey = Math.random().toString().replace('.','').repeat(4).substr(-16);
const settings = require('./settings.js');

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
	key: fs.readFileSync("./client_key.pem"),
	cert: fs.readFileSync("./client.pem"),
	//passphrase: options.PassPhrase,
	rejectUnauthorized: false,
	agent: false
};

var jsonrequest = settings.testuser;

exports.handler = async (event, context) => {
	// this returns a promise to the Lambda	handler
	return new Promise((resolve, reject) => {
		
		var proxyRestUri;

		if (event.queryStringParameters == undefined) {
			// this is used so that the "Test" button within Lambda function editor also
			// does its job and that the login can also start from this endpoint, not 
			// only from a redirect by the Qlik Sense Server
			console.log('No queryStringParameters provided at all');
			proxyRestUri = settings.defaultRestUri;
		} else {
			
			proxyRestUri = event.queryStringParameters.proxyRestUri || settings.defaultRestUri;
			// returns: 'https://senseserver.company.com:4243/qps/vproxy/'
			proxyRestUri = proxyRestUri.replace(settings.searchReplace[0], settings.searchReplace[1]);
			if (event.queryStringParameters.targetId) jsonrequest.TargetId = event.queryStringParameters.targetId;
		}
		httpOptions.host = proxyRestUri.split('//')[1].split('/')[0].split(':')[0];
		// returns:  'senseserver.company.com'
		httpOptions.port = Number(proxyRestUri.split('//')[1].split('/')[0].split(':')[1] || "4243"); 
		// returns: 4243
		httpOptions.path = proxyRestUri.substring(proxyRestUri.indexOf('/',8))
			+ 'ticket?xrfkey=' + xrfkey;
		// returns: '/qps/vproxy/ticket?xrfkey=xxxxxxxxxxxxxxxx'
		console.log('Posting ticket request to QPS API:');
		console.log('host', httpOptions.host);
		console.log('port', httpOptions.port);
		console.log('path', httpOptions.path) ;
		
		// creating a new https request to the Qlik Sense Server
		var req = https.request(httpOptions, function (res) {
			res.on('data', function (data) {
				//Parse ticket response
				try {
					var ticket = JSON.parse(data.toString());
					console.log('QPS response:', ticket);
					var redirectURI = ticket.TargetUri || settings.defaultReturn; 
					redirectURI = redirectURI + ((redirectURI.indexOf("?")>=0)?'&':'?') 	+ 'qlikTicket=' + ticket.Ticket;
					console.log('redirectURI',redirectURI);
					resolve({
						statusCode: 302, // 302 = redirect, 200 = OK
						headers: {Location: redirectURI}
						// body: 'got a ticket: ' + ticket.Ticket
					});
					
				} catch(e) {
					reject(e);
					return;
				}
			});
		});
		req.on('error',(e)=>{
			reject(e.message);
		});
		
		// Sending the json object with the POST request to QPS API
		req.write(JSON.stringify(jsonrequest));
		req.end();
	});
};
