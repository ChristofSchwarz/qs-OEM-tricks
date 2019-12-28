// need the following node modules: run
// npm install fs ws enigma.js

const WebSocket = require('ws');
const fs = require('fs');
const enigma = require('./node_modules/enigma.js/enigma.min.js');
const schema = require('./node_modules/enigma.js/schemas/12.170.2.json'); 
// match this schema to your Qlik Sense version.

/// IMPORTANT
// Choose 1 of the 4 configs below depending on your scenario:

/*
// [1] Config for Qlik Sense Desktop
const config = {
    serverUri: 'localhost',
    enginePort: 4848,
    protocol: 'ws',
    wsParams: {}
};
*/

// [2] Config for Qlik Sense Server when run on the same machine
// it will pick the necessary certificates from the default folder under C:\ProgramData\...
const config = {
    serverUri: 'localhost',
    enginePort: 4747,
    protocol: 'wss',
    wsParams: {
        rejectUnauthorized: false,  
        // you can skip providing "ca" if you set "rejectUnautzoried" to false
        //ca: fs.readFileSync('C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\root.pem'),  
        key: fs.readFileSync('C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client_key.pem'),
        cert: fs.readFileSync('C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\.Local Certificates\\client.pem'),
        headers: { 
		  //"X-Qlik-User": 'UserDirectory=INTERNAL;UserId=sa_engine',
		  "X-Qlik-User": 'UserDirectory=QMI-QS-SN;UserId=vagrant',
	      //"X-Qlik-Session": '8231b20b-c069-4c91-beab-1dc3afe668f1'	
		}
    }
}

/*
// [3] config for Qlik Sense Server but NodeJs is run on a remote machine 
// You need to copy the client.pem and client_key.pem files of the Sense server
// to the same folder where this .js code is run from
const config = {
    serverUri: 'qmi-qs-sn',
    enginePort: 4747,
    protocol: 'wss',
    wsParams: {
        rejectUnauthorized: false,  
        // you can skip providing "ca" if you set "rejectUnautzoried" to false
        //ca: fs.readFileSync('.\\root.pem'),  
        key: fs.readFileSync('.\\client_key.pem'),
        cert: fs.readFileSync('.\\client.pem'),
        headers: { "X-Qlik-User": 'UserDirectory=INTERNAL;UserId=sa_engine' }
    }
}
*/
/*
// [4] Config for Qlik Core running in a Docker Container
// Internally the engine port is 9076, externally whatever you configured
const config = {
    serverUri: '192.168.56.19',
    enginePort: 19076,
    protocol: 'ws',
    wsParams: {}
};
*/
function newMeasure(myTitle) {
    return { 
        qInfo:{ 
            //qId:"csw123",
            qType:"measure"
        },
        qMeasure:{ 
            qLabel: myTitle,
            qDef: "Sum (AROpen)-Sum(ARCurrent)",
            qGrouping: "N",
            qExpressions: [],
            qActiveExpression: 0,
            qLabelExpression: "=Upper('Amount Overdue2')",
            coloring:{ 
                baseColor:{ 
                    color: "#abcdef",
                    index:-1
                },
                gradient:{ 
                    colors:[ 
                        { 
                            color: "#123456",
                            index:-1
                        },
                        { 
                            color: "#fedcba",
                            index:-1
                        }
                    ],
                    breakTypes: [ false ],
                    limits: [ 0.5 ],
                    limitType: "percent"
                }
            }
        },
        qMetaDef:{ 
            title: myTitle,
            description: "The amount that is overdue.",
            tags: ["csw", "was", "here"]
        }
    }
}

const session = enigma.create({
    schema,
    //url: `${config.protocol}://${config.serverUri}:${config.enginePort}/app/engineData`, // /identity/8231b20b-c069-4c91-beab-1dc3afe668f1`,
	url: `${config.protocol}://${config.serverUri}:${config.enginePort}/app/engineData/identity/8231b20b-c069-4c91-beab-1dc3afe668f1`,
    createSocket: url => new WebSocket(url, config.wsParams)
});

function run() {
  return new Promise(async function(res,rej){
	var myArgs = process.argv.slice(2);
	var appId = myArgs[0];
	console.log('Hi.', myArgs);
	
    try {
        var global = await session.open();    
		console.log('Session opened with ' + global.session.config.url);
        var isDesktop = (global.session.config.url.indexOf('ws://localhost:4848')==0);
        var version = await global.engineVersion();
        console.log('Engine version:', version);

        var app = await global.openDoc(appId);
        var obj = await app.createSessionObject({
			qInfo: { qType: "MeasureList" },
			qMeasureListDef: { qType: "measure" }
        });
        var layout = await obj.getLayout();
        console.log(`I found the following ${layout.qMeasureList.qItems.length} measures in the app:`);
        for (var i=0; i<layout.qMeasureList.qItems.length; i++) {
            var measure=layout.qMeasureList.qItems[i];
            console.log(`Measure "${measure.qMeta.title}" (${measure.qInfo.qId})`);
            var measObj = await app.getMeasure({ qId: measure.qInfo.qId });
            var measLayout = await measObj.getLayout();
            var measProps = await measObj.getProperties();
            var measParams = measLayout.qMeasure;
            //console.log(`${measParams.qDef}`);
        }
        
        //var newApp = await global.createApp("App" + Math.random());
        //var app = await global.openDoc(newApp.qAppId);
        var newMeasParams = newMeasure('hdr user vagrant w/o /identity 2');
        //console.log(JSON.stringify(newMeasProps));
        var newMeas = await app.createMeasure( newMeasParams );
        console.log(`---- New Measure: ${newMeas.id}----`);
        var newMeasProps = await newMeas.getProperties();
        console.log(JSON.stringify(newMeasProps));
        var appProp = await app.getAppProperties();
		//console.log('app props');
		//console.log(appProp);
        if (appProp.published) {
            await newMeas.publish();
            await newMeas.approve();
        }
        if (isDesktop) {
          await app.doSave();
        }  
        await session.close();
        res();
    } catch(err) {
        await session.close();
        rej(err);
    }
  }) 
}

run().then(()=>{
    console.log('Bye.')
}).catch((err)=>{
    console.log('Error',err)
});



