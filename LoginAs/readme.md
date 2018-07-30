# Login As user

This is using Session API to establish a session for a given user. 
To help calling the Node JS application with the right parameters, a PowerShell Script should be started. 
The Script searches for node.exe and prompts for user name. Then it launches a browser window and a local 
Express Server. After a few seconds you can login as the given user.

This requires no password and uses the local certificates for login. Consider this as a high previlege and use with caution.
