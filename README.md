# PeacePinot Demo


## Google Cloud AutoML Object Detection Demo on Node.js

### Add your own settings in the following section of the app.js files

```javascript

const port       = 8080;
const gcsBucket = 'bkauf-peacepinot';//GCS Bucket to upload images- make sure access is public
const gcsFolder = 'uploads';//not implemented yet
const project   = 'bkauf-sandbox';//GCP Project Where Model is
const saToken   = '/var/run/secret/cloud.google.com/service-account.json';//location of service account JSON. K8s secret config below
const region = 'us-central1';//region of autoML model
const automlModel = 'IOD822197203064848384';//autoML model ID

```
# Build your container

```console
 docker build -t peacepinot:1.0 .
```

If you are running the container in a K8s cluster you can create a secret with the JSON file of a service account with the AutoML Predictor role instead of loading it into the container directly.

```console
kubectl create secret generic peacepinot --from-file service-account.json
```

![Image description](readme.png)
