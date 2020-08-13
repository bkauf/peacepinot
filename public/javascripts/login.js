
        var provider = new firebase.auth.GoogleAuthProvider();
        var config = {
        apiKey: "AIzaSyAXJpMI2gwV0y2JYqTux4Pw8IfyNwGU7vs",
         authDomain: "bkauf-sandbox.firebaseapp.com",
         };
        firebase.initializeApp(config);
    

        firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
        document.getElementById("message").innerHTML = "Welcome, " + user.email;
        } else {
        document.getElementById("message").innerHTML = "No user signed in.";
        }
        });
         function loginDirect(){
           var email = document.getElementById("email").value;
           var password = document.getElementById("password").value;
          firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
          document.getElementById("message").innerHTML = error.message;
          })
        };
        
         function loginGoogle(){
             firebase.auth().signInWithPopup(provider).then(function(result) {// sign in with google
               var user = result.user;
              document.getElementById("message").innerHTML = error.message;
              // This gives you a Google Access Token. You can use it to access the Google API.
               var token = result.credential.accessToken;
               // The signed-in user info.
               alert(result.user)
            }).catch(function(error) {
               // Handle Errors here.
               var errorCode = error.code;
               document.getElementById("message").innerHTML = error.message;
               var errorMessage = error.message;
                 // The email of the user's account used.
               var email = error.email;
               // The firebase.auth.AuthCredential type that was used.
               var credential = error.credential;
               // ...
            });
        }
