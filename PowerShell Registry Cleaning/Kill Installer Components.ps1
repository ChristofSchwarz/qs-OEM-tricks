cls
#$mykey = "HKLM:\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\UserData\S-1-5-18\Components"
$mykey = "HKLM:\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"

$found = 0
get-childitem $mykey | ForEach-Object -process {
    #$_.pspath
    $res = Get-ItemProperty $_.pspath
    #echo $res.PSobject.Properties[1].Name

    foreach ($property in $res.PSobject.Properties) {
        If ($property.Value -Like '*.qlik.*') {
            "killing " + $_.pspath + " .. " + $property.Value + " .. " + $property.Name
            #Remove-Item $_.pspath
            break
        } else {
            "keeping " + $_.pspath
        }
        
    }
 
}

# HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\UserData\S-1-5-18\Components\0035F10EBB33F37548E5C382B499934A 
#.. C:\Program Files\Qlik\Sense\WebExtensionService\node_modules\core-js\library\modules\es6.regexp.split.js 
#.. 4B7A0E139566DF24DA9B680B9DB9DD03
