# Check if scrit is run with administartor priviliges
# https://superuser.com/questions/749243/detect-if-powershell-is-running-as-administrator
if (-Not ([bool](([System.Security.Principal.WindowsIdentity]::GetCurrent()).groups -match "S-1-5-32-544"))) {
	Write-Host "You are not running this Powershell Script in Admin Mode."
	exit
} 
$searchstart = "C:\Program Files"
Write-Host Locating node.exe
$node = "C:\Program Files\Qlik\Sense\ServiceDispatcher\Node\node.exe"
if (-Not (Test-Path $node)) {
    $node = (dir -Path $searchstart -Filter node.exe -Recurse | %{$_.FullName})
	if ($node.Length -eq 0) {
   		Write-Host "Node.exe not found."
        exit
    }
}
Write-Host Found here $node
$name = Read-Host 'Which user to login? (format DIRECTORY\USERNAME)'
if (([regex]::Matches($name, "\\")).count -ne 1 -or $name.Length -lt 3) {
	Write-Host "That name $name was not in the expected format"
	exit
}
$name = $name.Split("\")
$bytes1 = [System.Text.Encoding]::Unicode.GetBytes($name[1].ToLower())
$bytes2 = [System.Text.Encoding]::Unicode.GetBytes($name[0].ToUpper())
$enc1 =[Convert]::ToBase64String($bytes1)
$enc2 =[Convert]::ToBase64String($bytes2)
Start-Process -FilePath ("https://"+$env:COMPUTERNAME+":8190/login?p="+[uri]::EscapeDataString($enc1)+"&z="+[uri]::EscapeDataString($enc2))
&"$node" .\loginas.js $env:COMPUTERNAME 4243
