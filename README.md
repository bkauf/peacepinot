# PeacePinot Demo


## Google Cloud AutoML Object Detection Demo on Node.js

### Add your own settings in the following section of the app.js files

```javascript

const port       = 8080;
var gcsBucket = "bkauf-peacepinot";//name of GCS Bucket
var gcsFolder = "uploads";//make sure access it public
var project   = "bkauf-sandbox";//GCP Project
var saToken   = "/usr/src/app/token.json";//location of service account JSON
const region = 'us-central1';//regin of autoML model
const automlModel = 'IOD822197203064848384';//autoML model ID

```


![Image description](readme.png)
