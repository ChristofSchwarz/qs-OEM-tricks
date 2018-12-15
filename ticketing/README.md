# Minimalistic NodeJs Qlik Sense Ticket Solution

This is pretty much the shortest code to get a user authenticated with a ticket (in this example it will always authenticate 
with one hardcoded user). 

Preconditions:
* setup a virtual proxy with a distinctive Prefix name and matching Session cookie header name, 
    - the authentication method is Ticket
    - the redirect URI is the location + '/login' of this nodeJs app e.g. 'http://localhost:3000/login'
   
* This code is meant to work together with a Virtual Proxy configured on the Qlik Sense Server. 
* The local express server listens to an incoming request with a specific query string format which the Qlik Sense Server 
will automatically produce when an unauthorized user hits a Sense resource first (e.g. https://[yourserver]/[vproxy]/hub)
* Put the client.pem and client_key.pem certificate files in the same folder as this .js file except when you run this nodeJs code on the same machine, than you needn't copy certificates as this code will also look for them in the default path "C:\ProgramData\Qlik\Sense\Repository\Exported Certificates\.Local Certificates"

1) try to go to a resource on the Sense Server (e.g. https://[yourserver]/[vproxy]/hub)
  
