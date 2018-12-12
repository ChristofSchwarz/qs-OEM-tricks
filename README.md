# OEM Tricks (API automation)

Different code snippets often needed by our OEMs to automate things around management and app modifications. I put here a collection of some typical requirements, feel free to steal and reuse whatever code.

1) <a href="https://github.com/ChristofSchwarz/qs-OEM-tricks/tree/master/LoginAs">LoginAs</a> (PowerShell + NodeJs)
  uses QPS API (Proxy Service API) to impersonate a given user from a Powershell command-line 
  
2) <a href="https://github.com/ChristofSchwarz/qs-OEM-tricks/tree/master/QPS%20SessionAPI">QPS (NodeJs)</a> same as above but only the essential code for NodeJs, it opens a minimalistic Express server through which you can login as    anybody

3) <a href="https://github.com/ChristofSchwarz/qs-OEM-tricks/tree/master/QRS%20NodeJs">QRS unallocate accesspasses</a> (NodeJs) looks for any allocated Professional and Analyzer access pass that hasn't been used by the user for  more than 7 days and unallocates it. This can help recycle licenses.


