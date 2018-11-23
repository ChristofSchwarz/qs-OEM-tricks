# qrs-unallocate.js

The job of this NodeJs app is to query the available license allocations (professional, analyzer) and then searches for allocations which haven't been used for more than 7 days. If such are found (and the respective user is not tagged with a tag called "keepAllocation") the allocation will be deleted, so that this professional or analyzer access can be reused by someone else. 

Note: 7 days is a quarantine hard-coded by Qlik, so to unallocate a user who used Qlik within the last 7d will turn this allocation into status Quarantined, and it is still not available until the 7d since last use are over. So I do not even attept to unallocate in this case.

Note: The 7 days are counted from the last use (login) of the user, not from the de-allocation moment.

The code snipped solves a few interesting things, which you can reuse also in other context:
 * has a good generic function qrsApi() which takes a method and the endpoint and returns a promise. 
