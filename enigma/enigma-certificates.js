
// Code is derived from 
// https://github.com/qlik-oss/enigma.js/tree/master/examples/authentication/sense-using-certificates
// Using certificates to authenticate against Qlik Sense server
// https://help.qlik.com/en-US/sense-developer/November2018/Subsystems/EngineAPI/Content/Sense_EngineAPI/GettingStarted/connecting-to-engine-api.htm
// the alternative would be to use Proxy Service API (QPS)

const enigma = require('./node_modules/enigma.js/enigma.min.js');
const WebSocket = require('ws');
const fs = require('fs');
const schema = require('./node_modules/enigma.js/schemas/12.170.2.json'); 
// match this schema to your Qlik Sense version.

const session = enigma.create({
    schema,
    url: 'wss://qmi-qs-aai/header:4747/app/engineData',
    createSocket: url => new WebSocket(url, {
        rejectUnauthorized: false,  
        //ca: [fs.readFileSync('.\\root.pem')],  // you can skip ca if you set rejectUnautzoried to false
        key: fs.readFileSync(".\\client_key.pem"),
        cert: fs.readFileSync(".\\client.pem"),
        headers: {
            // this impersonates any user! 
            "X-Qlik-User": 'UserDirectory=INTERNAL;UserId=sa_engine'
        }
    })
});

session.open().then(function (global) {
    console.log('Session was opened successfully');
    //console.log(global);
    return global.engineVersion().then(ret => {
        console.log(ret);
        return global.getDocList();
    }).then(ret => {
        // console a list of available documents
        ret.forEach(e=>{
            console.log(e.qDocId, e.qDocName);
        });
    }).catch(error => {
        console.error('Error', error);
    });
}).then(ret => {
    session.close();
}).catch(error => {
    console.error('Error', error);
});


