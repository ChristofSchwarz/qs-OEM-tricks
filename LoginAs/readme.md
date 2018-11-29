# Login As user

This is using Qlik Sense Session API(QPS) to establish a session for a given user. 
To help calling the Node JS application with the right parameters, a PowerShell Script should be started. 
The Script searches for node.exe and prompts for user name. Then it launches a browser window and a local 
Express Server. After a few seconds you can login as the given user.

This requires no password and uses the local certificates for login. Consider this as a high previlege and use with caution.

Launch from an elevated Powershell script (with Admin rights)
.\loginas.ps1

If the PowerShell script is not executed due to execution policy, use this command:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

