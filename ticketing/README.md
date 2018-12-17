# Minimalistic NodeJs Qlik Sense Ticket Solution

This is pretty much the shortest code to get a user authenticated with a ticket (in this example it will always authenticate 
with one hardcoded user). This code is good when the user is meant to navigate to the Qlik Sense resource at first place and a redirection to this minimalistic module is doing an "external authentication". You cannot start the login from this module at first, but need to be redirected from the Sense Server.

Preconditions:
* setup a virtual proxy with a distinctive Prefix name and matching Session cookie header name, 
    - the authentication method is Ticket
    - the redirect URI is the location + '/login' of this nodeJs app e.g. 'http://localhost:3000/login'
    - dont forget to link it to the Central Proxy
![alttext](https://github.com/ChristofSchwarz/pics/raw/master/vproxyconfig.png "screenshot")    
   
* Copy the client.pem and client_key.pem certificate files from the Sense server (found in "C:\ProgramData\Qlik\Sense\Repository\Exported Certificates\.Local Certificates") into the same folder as this .js file except when you run this nodeJs code on the same machine (that case this code will also look for them in the default path)

* go to the folder of this .js and install the three JavaScript modules "npm install https express fs"
* run this app "node getticket.js"


-> The local express server now listens to an incoming request with a specific query string format which the Qlik Sense Server 
will automatically produce when an unauthorized user first hits a Sense resource first 

Now try this

1) Go to a resource on the Sense Server (e.g. https://[yourserver]/[vproxy]/hub/my/work)
2) Sense sees that the user isn't authenticated and redirects the browser to this address: http://localhost:3000/login?proxyRestUri=https%3a%2f%2f[yourserver]%3a4243%2fqps%2f[vproxy]%2f&targetId=[randomid]
3) Now our NodeJs app parses the given proxyRestUri and sends out this request to the Qlik Sense QPS API via the service port 4243 and presenting the certificates
    - POST https://[yourserver]/[vproxy]/ticket together with who the user should be (here: hardcoded Json)
4) The QPS API responds with a Json containing the Ticket-number, a cookie, and the resource which the user originally wanted to go to (e.g https://[yourserver]/[vproxy]/hub/my/work)
5) The nodeJs app redirects the browser back to that resource and adds the ticket-number to the url (https://localhost/vpticket/hub/my/work?QlikTicket=[ticketid])
6) The user accesses now the Sense resource as the user we specified in step 3


