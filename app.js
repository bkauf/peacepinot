var request      = require('request');
var fs           = require("fs");
const fileUpload = require('express-fileupload');
var express      = require('express');
var sizeOf       = require('image-size');
const automl     = require('@google-cloud/automl');
const {Storage}  = require('@google-cloud/storage');
const sharp      = require('sharp');
var app          = express();

// account specific variables
const port        = 8080;
const gcsBucket   = 'bkauf-peacepinot';//name of GCS Bucket make sure access is public
const gcsFolder   = 'uploads';//not finished
const project     = 'bkauf-sandbox';//GCP Project Where Model is
const saToken     = '/var/run/secret/cloud.google.com/service-account.json' || '';

const region      = 'us-central1';//region of autoML model
const automlModel = 'IOD822197203064848384';//object
// end account specifc variables
// Comment out for 3/2 event

       const client = new automl.PredictionServiceClient({
         projectId: project//,
       //  keyFilename: saToken, //taken out for cloud run specific access
       });
       const storage = new Storage({
         projectId: project//,
       //  keyFilename: saToken ////taken out for cloud run specific access
       });

//end
var path         = require('path');
var favicon      = require('serve-favicon');
var bodyParser   = require('body-parser');
var index        = require('./routes/index');
var loaderPage   = require('./routes/loaderio');

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', index);
app.use(fileUpload());
app.use('/loaderio-7fb93f7a58f56efbca84be04d559c29d', loaderPage);

app.post('/automl',function(req,res){
    var timeStamp = Date.now();
    var uploadPath = './public/images/uploads/raw/'+timeStamp+'.jpg';
    var resizePath = './public/images/uploads/resize/'+timeStamp+'.jpg';
    if (Object.keys(req.files).length == 0) {
       return res.status(400).send('No files were uploaded.');
     }
     // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
     let sampleFile = req.files.imageupload;

     // Use the mv() method to place the file somewhere on your server
     sampleFile.mv(uploadPath , function(err) {
       if (err)

         console.log('File uploaded!');
         var inputFile    = uploadPath ;
         var outputFile   = '';
         var resize       = false;
         var dimensions   = sizeOf(inputFile);
         var newWidth     = 0;
         var newHeight    = 0;
         var aspectRatio  = Number(dimensions.width)/Number(dimensions.height);
         if (Number(dimensions.width)>500 || Number(dimensions.height>500) ){
                 resize = true;
                 console.log("Resize Image: "+dimensions.width+" "+dimensions.height);
             if (Number(dimensions.height)>Number(dimensions.width)){//calculate larger side
               newWidth   = Math.round((499 * aspectRatio));
               newHeight  = 499;

             }else{
               newHeight = Math.round((499/aspectRatio));
               newWidth  = 499;
             }

              outputFile  = resizePath;

         }else{
              newWidth   = dimensions.width;
              newHeight  = dimensions.height;
              outputFile = uploadPath;
         }
              /*************** Resize Image ***********/
              sharp(inputFile).resize(newWidth, newHeight).toFile(outputFile, (err, info) => {

                    console.log('!Enter Predict!: '+outputFile);
                    var bitmap = fs.readFileSync(outputFile);
                    var content   = new Buffer.from(bitmap).toString('base64');
                    var payload = {};
                    payload.image = {imageBytes: content};
                    var formattedName = client.modelPath(project, region, automlModel);
                    var request = {
                        name: formattedName,
                        payload: payload,
                      };
                    /*************** Upload Image to GCS ***********/
                    var bucket = storage.bucket(gcsBucket);
                    var fileName = path.basename(outputFile);
                    var file = bucket.file(fileName);
                    var options = options || {};

                    bucket.upload(outputFile, options, function(err, fileData) {
                      file.makePublic();
                      fs.unlinkSync(outputFile);
                      if(resize !=true){
                        fs.unlinkSync(uploadPath);
                      }
                      var  fileURL = 'https://storage.googleapis.com/'+gcsBucket+'/'+fileName;
                       console.log('Image Uploaded: '+fileURL);

                      /*************** automl Prediction ***********/
                        client.predict(request)
                        .then(responses => {
                          const response = responses[0];

                          var message = "NO, Not Peace Pinot :(";
                          var xycords     = [{x:0,y:0},{x:0,y: 0}];
                          var automlScore = 0;

                          if (typeof response.payload[0] !== 'undefined') {
                            //var xycords      = response.payload[0].imageObjectDetection.boundingBox['normalizedVertices'];
                            var automlScore  = round(response.payload[0].imageObjectDetection.score, 2);
                            message  = "YES YES Peace Pinot!";
                            // Get all bounding boxes
                            var xycords =[]
                            var arrayLength = response.payload.length;
                            for (var i = 0; i < arrayLength; i++) {
                              //  console.log(myStringArray[i]);
                                xycords[i]= response.payload[i].imageObjectDetection.boundingBox['normalizedVertices'];
                            }
                          //  console.log(JSON.stringify(xycords));
                            console.log("Peace Pinot!: "+automlScore);

                          }
                            res.render('results', { imgWidth:newWidth,
                              imgHeight:newHeight,
                              title: message,
                              //imagesrc:'images/uploads/'+filePath+"/"+fileName,
                              imagesrc: fileURL,
                              xycords:JSON.stringify(xycords),
                              score: automlScore,
                              imageWidth: newWidth,
                              imageHeight: newHeight});
                            })
                              .catch(err => {
                                console.error(err);
                              });
                  });//end gcs upload callback
            });//end of resize callback
      });//end file upload callback
      console.log('AutoML Completed');

    });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
app.listen(port, () => console.log(`Example app listening on port ${port}!`))


function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}
