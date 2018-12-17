Download this as .zip and upload as a new AWS Lambda function. Add your API Gateway as trigger.

![alttext](https://github.com/ChristofSchwarz/pics/raw/master/lambdafunction.png "screenshot")

Then upload the client.pem and client_key.pem files from your Qlik Sense Server to the root folder of this function (next to index.js). 
You can find those files on your Sense Server under
 * C:\ProgramData\Qlik\Sense\Repository\Exported Certificates\.Local Certificates

Open Port 4243 on your virtual machine (this may include local firewall as well as your AWS or Azure or ... network settings)
