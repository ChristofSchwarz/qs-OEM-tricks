# qrs-unallocate.js

The job of this NodeJs app is to query the available license allocations (professional, analyzer) and then searches for allocations which haven't been used for more than 7 days. This app has two modes:
 * report, do not make changes: this is the default if you do not add a command-line argument)
 * unallocate ('recycle' allocations) if possible: needs command-line argument "true" e.g. node qrs-unallocate.js true)

If you are in 'recycle' mode, it looks for allocations of professional and analyzer access types that haven't been used for more than 7 days and where the respective user is not  tagged with the tag "keepAllocation" (in the QMC). Such allocation will be deleted, so that this professional or analyzer access can be reused by someone else immediately after. 

Note: 7 days is a quarantine hard-coded by Qlik, so to unallocate a user who used Qlik within the last 7d will turns this allocation into status 'quarantined' and it is still not available until the 7d since last use are over. So I do not even attept to unallocate in this case.

Note: The 7 days are counted from the last use (login) of the user, not from the de-allocation moment.

*The code snipped solves a few interesting things, which you can reuse also in other context:
 * has a good generic function qrsApi() which takes a method and the endpoint and returns a promise and has error handling.
 * it shows how to wait for an array of promises (serach for await Promise.all)*
 
Preconditions:
 * QRS API is used via Qlik Sense server port 4242 and certificates
 * if run on the same machine as Qlik Sense server, you do not need to copy certificates, it will find it in the default folder "C:\ProgramData\Qlik\Sense\Repository\Exported Certificates\.Local Certificates"
 * if run from another machine, make sure the port is open and copy the client.pem and client_key.pem into the same folder as the qrs-unallocate.js file
 
 ![](https://github.com/ChristofSchwarz/pics/raw/master/screenshot-qrs-dealloc.png "screenshot")
