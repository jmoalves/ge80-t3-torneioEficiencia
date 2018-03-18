// Node dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
//

// Firebase
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");
var admin = require("firebase-admin");

var serviceAccount = require(path.resolve(os.homedir(), ".google/ge80-chave.json"));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ge80-ec955.firebaseio.com"
});
// Initialize Cloud Firestore through Firebase
var db = admin.firestore();
//

var torneioRef = db.collection("torneioEficiencia").doc("escoteiros").collection("apuracoes");
var query = torneioRef.where("ano", "==", "2017");
query.get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            console.log(doc.id, " => ", doc.data());
        });
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });