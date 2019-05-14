var request      = require('request');
var fs           = require("fs");
const fileUpload = require('express-fileupload');
var express      = require('express');
var sizeOf       = require('image-size');
var app          = express();
const port       = 8080;
const automl = require('@google-cloud/automl');
const sharp  = require('sharp');

const client = new automl.PredictionServiceClient({
  projectId: 'bkauf-sandbox',
  keyFilename: '/usr/src/app/bkauf-sandbox.json',
});

const project = 'bkauf-sandbox';
const region = 'us-central1';
//const automlModel = 'ICN973436885879248128';//classification
const automlModel = 'IOD822197203064848384';//object

 //filePath = 'GCS_PATH',
process.env.GOOGLE_APPLICATION_CREDENTIALS ='/usr/src/app/bkauf-sandbox.json';

 // Instantiates a client
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

/* app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
*/

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
         newWidth     = 0;
         newHeight    = 0;
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
               console.log("Test2 dimentions"+newWidth+newHeight);
             }
        }else{
             var newWidth  = dimensions.width;
             var newHeight = dimensions.height;
        }
            console.log("Test dimentions"+newWidth+newHeight);
            imageResize(inputFile,outputReFile,newWidth,newHeight,resize, function(outputFile) {
                  console.log('enter predict');
                        console.log(outputFile);
                        var bitmap = fs.readFileSync(outputFile);
                      //const content  = fs.readFileSync(filePath, 'base64');
                      const content   = new Buffer(bitmap).toString('base64');
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
                      //  console.log(response.payload[0].displayName);
                      //  res.send(JSON.stringify(response));

                      var message = "NO, Not Peace Pinot :(";
                      var xycords     = [{x:0,y:0},{x:0,y: 0}];
                      var automlScore = 0;

                      if (typeof response.payload[0] !== 'undefined') {
                        var xycords      = response.payload[0].imageObjectDetection.boundingBox['normalizedVertices'];
                        var automlScore  = response.payload[0].imageObjectDetection.score;
                        var message      = "YES YES Peace Pinot!";
                        console.log("Peace Pinot!");
                      //console.log("Cords:"+JSON.stringify(xycords));
                        console.log("Score:"+automlScore);
                        //console.log("Height:"+dimensions.height);
                        //console.log("Width:"+dimensions.width);

                      }

                        fileNameArry = outputFile.split("/");
                        filePath = fileNameArry[4];
                        fileName = fileNameArry[5];

                        var dimensions = sizeOf(outputFile);

                        res.render('results', { imgWidth:newWidth,imgHeight:newHeight, title: message, imagesrc:'images/uploads/'+filePath+"/"+fileName,xycords:JSON.stringify(xycords), score: automlScore,imageWidth: newWidth, imageHeight: newHeight});
                            delete newWidth;
                            delete newHeight;


                        })
                          .catch(err => {
                            console.error(err);
                          });


            });//end of resize callbacl

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
  //  return  inputFile;
      callback(inputFile);
  }
  //  return   outputFile;

}
