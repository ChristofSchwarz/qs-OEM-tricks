# Combine the work of Enigma and QRS

This nodejs code creates an empty copy (no data) from a given template app, which partly needs the QRS API (Repository Service) and partly Enigma (Engine API).

You need the certificates of the server you are communicating with (Client.pem and client_key.pem file). If you are not running this nodeJs code on the same machine where Qlik Sense Server is setup, place the two certifcates in the same folder as this .js file. If you run it from the same machine, the script will search for the certificates under the default folder in C:\ProgramData\Qlik\Sense\Repository\Exported Certificates\.Local Certificates and you needn't copy them.

Steps performed:
 * Make a copy of the source app (QRS)
 * Open the app without data = make it empty but keep all UI design & script (Enigma)
 * manipulate the script (Enigma)
 * Save the app = now the app is empty (Enigma)
 * Close session (Enigma)

Prerequisites:
 * open ports 4747 (Engine API) and 4242 (QRS API) or run from the same machine as the server
 * needs the certificate files __client.pem__ and __client_key.pem__ 
 * install 4 npm packages: __npm install enigma.js ws fs https__ 
 
