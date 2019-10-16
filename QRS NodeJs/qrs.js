var https = require('https'); 
var fs = require('fs'); 

var cmdLineArg1 = '' + process.argv[2];
var cmdLineArg2 = '' + process.argv[3];

async function qrsApi(method, endpoint) {
	//var currentdate = new Date();
	//var func_return;
	
	var options = { 
		rejectUnauthorized: false, 
		hostname: 'localhost', 
		port: 4242, 
		path: endpoint + '?xrfkey=abcdefghijklmnop', 
		method: method, 
		headers: { 
			"X-Qlik-Xrfkey" : 'abcdefghijklmnop'
			,"X-Qlik-User" : 'UserDirectory=Internal;UserId=sa_repository' 
			}, 
		key: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem")
		,cert: fs.readFileSync("C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem") 
	}; 
	https.get(options, function(res) { 
		//console.log("Response Code: " + res.statusCode); 
		res.on('data', function(chunk) { 
			//func_return += chunk;
			console.log("" + chunk);
			//console.log(currentdate.getSeconds());
		}); 
	}).on('error', function(e) { 
		func_return = e;
		console.log("Got error: " + e.message); 
	}).on('end', function() {
		console.log("Finished.");
		//inp = func_return;
		//return(func_return);
	});	
}
if (cmdLineArg1 == 'undefined' || cmdLineArg2 == 'undefined') {
	console.log('Need two arguments: method and QRS endpoint. Try this');
	console.log('node ' + process.argv[1] + ' get /qrs/about');
} else {
	//qrsApi('GET', '/ssl/ping');	
	qrsApi(cmdLineArg1, cmdLineArg2);	
	//qrsApi('POST', '/qrs/app/upload?name=MyNewApp');	
}


