// Copyright 2018 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
process.env.GOOGLE_APPLICATION_CREDENTIALS ='/usr/src/app/bkauf-sandbox.json';

// Replace the strings below with your own project & model info
const project = 'bkauf-sandbox';
const region = 'us-central1';
const automlModel = 'ICN3398747586130927737';
const filePath = './public/images/filename.jpg';
const scoreThreshold = '0.50';
const automl = require('@google-cloud/automl');
const fs = require('fs');
const client = new automl.PredictionServiceClient({
  projectId: 'bkauf-sandbox',
  keyFilename: '/usr/src/app/bkauf-sandbox.json',
});


// Get the full path of the model.

// Read the file content for prediction.
const content = fs.readFileSync(filePath, 'base64');
// Set the payload by giving the content and type of the file.
const payload = {};
payload.image = {imageBytes: content};


const formattedName = client.modelPath(project, region, automlModel);

const request = {
  name: formattedName,
  payload: payload,
};
client.predict(request)
  .then(responses => {
    const response = responses[0];
  console.log(response.payload[0].displayName);
  })
  .catch(err => {
    console.error(err);
  });
