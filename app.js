var request      = require('request');
var fs           = require("fs");
const fileUpload = require('express-fileupload');
var express      = require('express');
var app          = express();
const port       = 8080;
const automl = require('@google-cloud/automl');
const client = new automl.PredictionServiceClient({
  projectId: 'bkauf-sandbox',
  keyFilename: '/usr/src/app/bkauf-sandbox.json',
});

const project = 'bkauf-sandbox';
const region = 'us-central1';
const automlModel = 'ICN973436885879248128';
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

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(fileUpload());
app.post('/automl',function(req,res){


    if (Object.keys(req.files).length == 0) {
       return res.status(400).send('No files were uploaded.');
     }

     // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
     let sampleFile = req.files.imageupload;

     // Use the mv() method to place the file somewhere on your server
     sampleFile.mv('./public/images/filename.jpg', function(err) {
       if (err)
      //   return res.status(500).send(err);
    console.log('File uploaded!');
    console.log('enter predict');
    var filePath = './public/images/filename.jpg';
    var bitmap = fs.readFileSync(filePath);
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
    console.log(response.payload[0]);
  //  res.send(JSON.stringify(response));
  var message = "YES YES Peace Pinot!";
  if (response.payload[0].displayName != 'wine_emoji'){
    var message = "NO, Not Peace Pinot :("
  }
    res.render('results', { title: message, imagesrc:'images/filename.jpg'});


      })
      .catch(err => {
        console.error(err);
      });

      //fs.unlink('./uploads/filename.jpg');
      console.log('automl completed');

    });
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
