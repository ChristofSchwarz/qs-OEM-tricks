@echo off
rem // Batch file by Christof Schwarz to repeat the session cleanup every 20 seconds
rem // It passes 1 optional argument (the max no of sessions per user) to the node app.
rem // for example: repeat 4 
rem // keeps max 4 sessions per user. repeat without argument just lists the sessions
rem // and will not terminate any.
:loop
"C:\Program Files\Qlik\Sense\ServiceDispatcher\Node\node.exe" .\app.js %1
timeout /t 20 /nobreak
goto :loop
