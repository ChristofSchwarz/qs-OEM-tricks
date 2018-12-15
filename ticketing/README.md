# Minimalistic NodeJs Qlik Sense Ticket Solution

This is pretty much the shortest code to get a user authenticated with a ticket (in this example it will always authenticate 
with one hardcoded user). 

Preconditions:
* setup a virtual proxy with a distinctive Prefix name and matching Session cookie header name, 
    - the authentication method is Ticket
    - the redirect URI is the location + '/login' of this nodeJs app e.g. 'http://localhost:3000/login'
    - dont forget to link it to the Central Proxy
![alttext](https://github.com/ChristofSchwarz/pics/raw/master/vproxyconfig.png "screenshot")    
   
* Copy the client.pem and client_key.pem certificate files from the Sense server (found in "C:\ProgramData\Qlik\Sense\Repository\Exported Certificates\.Local Certificates") into the same folder as this .js file except when you run this nodeJs code on the same machine (that case this code will also look for them in the default path)

* go to the folder of this .js and install the three JavaScript modules "npm install https express fs"
* run this app "node ticket.js"


-> The local express server now listens to an incoming request with a specific query string format which the Qlik Sense Server 
will automatically produce when an unauthorized user first hits a Sense resource first 


1) try to go to a resource on the Sense Server (e.g. https://[yourserver]/[vproxy]/hub)
  
