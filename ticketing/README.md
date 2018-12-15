# Minimalistic Qlik Sense Ticket Solution

This is pretty much the shortest code to get a user authenticated with a ticket (in this example it will always authenticate 
with one hardcoded user). 

* This code is meant to work together with a Virtual Proxy configured on the Qlik Sense Server. 
* The local express server listens to an incoming request with a specific query string format which the Qlik Sense Server 
will automatically produce when an unauthorized user hits a Sense resource first (e.g. https://<yourserver>/<vproxy>/hub)
  
