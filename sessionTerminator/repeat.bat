@echo off
rem // Batch file by Christof Schwarz to repeat the session cleanup every N seconds
rem // 1) the first parameter must be N (repeat in N seconds)
rem // 2) the 2nd parameter is optional and represents the max no of sessions per user;
rem //    this param is sent to the NodeJS app. Without the 2nd argument "repeat" will 
rem //    just lists the user sessions and will not terminate any.
rem // for example: 
rem // repeat 20 4 
rem // means, check every 20 seconds and keeps max 4 sessions per user. 
if %1.==. (
    echo Syntax: repeat N [M]
    echo You need to provide at least 1 parameter: N .. number, seconds after which to repeat.
    echo 2nd parameter M is optional, when provided and one Sense user has more than M sessions 
    echo such sessions will be terminated
    goto :end
)    
:loop
"C:\Program Files\Qlik\Sense\ServiceDispatcher\Node\node.exe" .\app.js %2
timeout /t %1 /nobreak
goto :loop
:end

