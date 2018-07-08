cls
$mykey = "HKLM:\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\UserData\S-1-5-18\Products"

get-childitem $mykey | ForEach-Object -process {
    $parent = $_.pspath
    $deleteparent = $false
    #"New Path: " + $_.pspath
    get-childitem $parent | ForEach-Object -process {
        #"Child Path: " + $_.pspath
   
        $res = Get-ItemProperty $_.pspath

        foreach ($property in $res.PSobject.Properties) {
            If ($property.Value -Like '*\qlik\*') {
                $deleteparent = $true
                break
            } 
        }
 


    }
    if ($deleteparent) {
        "killing " + $parent
        #Remove-Item $parent -Recurse
    } else {
        "keeping " + $parent
    }    

    
}

#Remove-Item Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\UserData\S-1-5-18\Components\0035F10EBB33F37548E5C382B499934A

# HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Installer\UserData\S-1-5-18\Components\0035F10EBB33F37548E5C382B499934A 
#.. C:\Program Files\Qlik\Sense\WebExtensionService\node_modules\core-js\library\modules\es6.regexp.split.js 
#.. 4B7A0E139566DF24DA9B680B9DB9DD03
