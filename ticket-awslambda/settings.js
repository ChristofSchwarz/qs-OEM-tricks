// Settings if you like to start login from this endpoint instead of a redirect by Qlik Sense server.
// In this case, the location of the QPS API and the return-URL are used from below results
module.exports = {
	defaultReturn: 'https://qse-csw.westeurope.cloudapp.azure.com/vpticket/hub/my/work',
	defaultRestUri: 'https://qse-csw.westeurope.cloudapp.azure.com:4243/qps/vpticket/',
	// searchReplace manipulates the QPS URL provided by the Qlik Sense Server. On Azure based Sense
	// Servers this url can be the internal network name, which wouldn't work for this Lambda function
	searchReplace: ['0tcxhvlqqpyuncpeshxjajbkee.ax.internal.cloudapp.net','westeurope.cloudapp.azure.com']
	// searchReplace: [null,null]
}	
