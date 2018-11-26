# enigma-certs.js

Example of a code that uses Engine Port 4747 (Qlik Sense Server) to connect with certificates. You need the Client.pem and
client_key.pem file. Either place the two certifcates in the same folder as this .js file, otherwise the script will search for the 
certificates under the default folder in C:\ProgramData\Qlik\Sense\Repository\Exported Certificates\.Local Certificates

Prerequeistes:
 * make sure port 4747 is open or run from the same machine as the server
 * needs the certificate files __client.pem__ and __client_key.pem__
 * install the three packages: __npm install enigma.js ws fs__ 
 
 
