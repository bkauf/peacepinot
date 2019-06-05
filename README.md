# PeacePinot Demo


## Google Cloud AutoML on Node.js Demo

### Add your own settings in the following section of the app.js files
```javascript

const port       = 8080;
var gcsBucket = "bkauf-peacepinot";//name of GCS Bucket
var gcsFolder = "uploads";//not finished
var project   = "bkauf-sandbox";//GCP Project
var saToken   = "/usr/src/app/bkauf-sandbox.json";//location of service account JSON
const region = 'us-central1';//regin of autoML model
const automlModel = 'IOD822197203064848384';//autoML model ID

```


![Image description](readme.png)
