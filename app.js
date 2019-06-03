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
const port       = 8080;
var gcsBucket = "bkauf-peacepinot";
var gcsFolder = "uploads";//not finished
var project   = "bkauf-sandbox";
var saToken   = "/usr/src/app/bkauf-sandbox.json";
const region = 'us-central1';
const automlModel = 'IOD822197203064848384';//object
// end account specifc variables


const client = new automl.PredictionServiceClient({
  projectId: project,
  keyFilename: saToken,
});

const storage = new Storage({
  projectId: project,
  keyFilename: saToken
});

var path         = require('path');
var favicon      = require('serve-favicon');
var bodyParser   = require('body-parser');
var index        = require('./routes/index');


app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', index);
app.use(fileUpload());


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
      //   return res.status(500).send(err);
         console.log('File uploaded!');
         let inputFile    = uploadPath ;
         let outputReFile = resizePath;
         var resize       = "false";
         var dimensions   = sizeOf(inputFile);
         var newWidth     = 0;
         var newHeight    = 0;
         var aspectRatio  = Number(dimensions.width)/Number(dimensions.height);
         if (Number(dimensions.width)>500 || Number(dimensions.height>500) ){
                 resize = "yes";
                 console.log("Resize Image"+dimensions.width+" "+dimensions.height);
             if (Number(dimensions.height)>Number(dimensions.width)){//calculate larger side
               newWidth   = Math.round((499 * aspectRatio));
               newHeight  = 499;

             }else{
               newHeight = Math.round((499/aspectRatio));
               newWidth  = 499;

             }
         }else{
              newWidth  = dimensions.width;
              newHeight = dimensions.height;
         }
            console.log("Test dimentions"+newWidth+newHeight);
            imageResize(inputFile,outputReFile,newWidth,newHeight,resize, function(outputFile) {//resize images

                  console.log('enter predict');
                        console.log(outputFile);
                        var bitmap = fs.readFileSync(outputFile);
                        var content   = new Buffer(bitmap).toString('base64');
                        const payload = {};
                        payload.image = {imageBytes: content};
                        const formattedName = client.modelPath(project, region, automlModel);
                        const request = {
                          name: formattedName,
                          payload: payload,
                        };
                    gcsMove(gcsBucket,gcsFolder,outputFile, function(fileURL) {// move image to GCS & delete temp image
                        console.log('Image Uploaded:'+fileURL);

                      // fs.unlinkSync(outputFile);//delete original file from server
                      //  console.log("original file deleted from server");
                        client.predict(request)
                        .then(responses => {
                          const response = responses[0];

                      var message = "NO, Not Peace Pinot :(";
                      var xycords     = [{x:0,y:0},{x:0,y: 0}];
                      var automlScore = 0;

                      if (typeof response.payload[0] !== 'undefined') {
                        var xycords      = response.payload[0].imageObjectDetection.boundingBox['normalizedVertices'];
                        var automlScore  = response.payload[0].imageObjectDetection.score;
                            message      = "YES YES Peace Pinot!";
                        console.log("Peace Pinot!");
                        console.log("Score:"+automlScore);
                      }
                        res.render('results', { imgWidth:newWidth,
                          imgHeight:newHeight,
                          title: message,
                          //imagesrc:'images/uploads/'+filePath+"/"+fileName,
                          imagesrc: fileURL,
                          xycords:JSON.stringify(xycords),
                          score: automlScore,imageWidth: newWidth,
                          imageHeight: newHeight});
                        })
                          .catch(err => {
                            console.error(err);
                          });
                  });//end gcs upload callback
            });//end of resize callback
      });//end file upload callback
      console.log('automl completed');

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


function imageResize(inputFile,outputFile,newWidth,newHeight,resize,callback){
    if (resize == "yes"){
        console.log("starting dimensions:"+JSON.stringify(sizeOf(inputFile)));
        console.log("To: "+newWidth+" "+newHeight);
         sharp(inputFile).resize({ width: newWidth,height: newHeight}).toFile(outputFile)
               .then(function(newFileInfo){
                   // newFileInfo holds the output file properties
                   console.log("Image Resized:"+JSON.stringify(newFileInfo));
                   //fs.unlink('./public/images/uploads/filenameRaw.jpg');
                   callback(outputFile);
                })
                .catch(function(err) {
                       console.log("Error occured Resizing Image Width"+err);
                });
  }else{
  //  return  inputFile as file did not need to be modified;
      callback(inputFile);
  }
}

function gcsMove(BUCKET_NAME,FOLDER,FILEURL, callback){
  console.log('move image to cloud storage');
  var options = options || {};
  const  bucket = storage.bucket(BUCKET_NAME);
  const fileName = path.basename(FILEURL);
  const file = bucket.file(fileName);
   bucket.upload(FILEURL, options)
      .then(() => file.makePublic())
      .then(() => fs.unlink(FILEURL));
   callback('https://storage.googleapis.com/'+BUCKET_NAME+'/'+fileName);
}
