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

var ciclosDir = 'ciclos';
var ciclos = fs.readdirSync(ciclosDir);
for (let ciclo of ciclos) {
    if (ciclo.match(/\.json$/)) {
        carregaCiclo(path.resolve(ciclosDir, ciclo));
    }
}

function carregaCiclo(filename) {
    console.log("Filename: " + filename);

    var json = fs.readFileSync(filename);
    // console.log("JSON: " + json);

    var ciclo = JSON.parse(json);
    // console.log("Ciclo " + ciclo);

    var id = Object.keys(ciclo)[0];
    console.log("Ciclo " + id);

    db.collection("torneioEficiencia").doc("escoteiros").collection("apuracoes").doc(id).set(ciclo[id]).then(() => {
        console.log("CICLO: " + id + " inserido!");
    }).catch((error) => {
        console.log("Error: " + error);
    });
}