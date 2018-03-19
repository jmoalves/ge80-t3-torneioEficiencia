// Node dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
//

// 3rdParty
const base64 = require('js-base64').Base64;
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

// carregaCiclos();
carregaPatrulhas();

function carregaCiclos() {
    var anos = {};

    var dir = 'ciclos';
    var files = fs.readdirSync(dir);
    for (let file of files) {
        if (file.match(/\.json$/)) {
            var ciclo = carregaCiclo(path.resolve(dir, file));
            agrega(anos, ciclo);
        }
    }
    carregaAnos(anos);
}

function carregaPatrulhas() {
    var dir = 'patrulhas';
    var json = fs.readFileSync(path.resolve(dir, 'patrulhas.json'));

    var patrulhas = JSON.parse(json);

    for (let key in patrulhas) {
        var avatar = fs.readFileSync(path.resolve(dir, key, 'avatar.jpg'));
        var patrulha = patrulhas[key];
        patrulha.avatar = base64.encode(avatar);

        db.collection("ramos").doc("escoteiros").collection("patrulhas").doc(key).set(patrulha).then(() => {
            console.log("PATRULHA: " + key + " inserida!");
        }).catch((error) => {
            console.log("Error: " + error);
        });
    }
}

function carregaCiclo(filename) {
    console.log("");
    console.log("Filename: " + filename);

    var json = fs.readFileSync(filename);
    // console.log("JSON: " + json);

    var ciclo = ajustaCiclo(json);
    console.log("CICLO: " + ciclo.id);
    // console.log(JSON.stringify(ciclo));
    db.collection("torneioEficiencia").doc("escoteiros").collection("apuracoes").doc(ciclo.id).set(ciclo).then(() => {
        console.log("CICLO: " + ciclo.id + " inserido!");
    }).catch((error) => {
        console.log("Error: " + error);
    });

    return ciclo;
}

function agrega(anos, ciclo) {
    if (!anos[ciclo.ano]) {
        anos[ciclo.ano] = {
            maxPontos: 0,
            patrulhas: {}
        }
    }

    anos[ciclo.ano].maxPontos += ciclo.maxPontos
    for (let patrulha in ciclo.patrulha) {
        if (!anos[ciclo.ano].patrulhas[patrulha]) {
            anos[ciclo.ano].patrulhas[patrulha] = {
                totalGeral: 0
            }
        }
        anos[ciclo.ano].patrulhas[patrulha].totalGeral += ciclo.patrulha[patrulha].totais.geral;
    }
}

function carregaAnos(anos) {
    console.log("Anos: " + JSON.stringify(anos));
    for (let ano in anos) {
        db.collection("torneioEficiencia").doc("escoteiros").collection("anos").doc(ano).set(anos[ano]).then(() => {
            console.log("ANO: " + ano + " inserido!");
        }).catch((error) => {
            console.log("Error: " + error);
        });
    }
}

function ajustaCiclo(json) {
    var obj = JSON.parse(json);
    var id = Object.keys(obj)[0];

    var ciclo = obj[id];
    ciclo.ano = id.substr(0, 4);

    ajustaPatrulhas(ciclo);
    return ciclo;
}

function ajustaPatrulhas(ciclo) {
    let maxPontos = 0;
    let patrulhas = [];

    for (let id in ciclo.patrulha) {
        let patrulha = ciclo.patrulha[id];
        patrulha.id = id;

        computaPontosPatrulha(patrulha);

        if (patrulha.totais.geral > maxPontos) {
            maxPontos = patrulha.totais.geral;
        }

        patrulhas.push(patrulha);
    }

    ciclo.maxPontos = maxPontos;
};

function computaPontosPatrulha(patrulha) {
    patrulha.totais = {
        geral: 0,

        totalPontualidade: 0,
        totalPresenca: 0,
        totalVestuario: 0,
        totalParticipacao: 0,
        totalEspiritoEscoteiro: 0,
        totalJogoTecnico: 0,
        totalGeralReuniao: 0,
        totalDiaReuniao: {},

        totalConquistas: 0,
        totalExtras: 0,
        totalPenalidade: 0,
        totalAtividadeExterna: 0,
        totalGeralExtras: 0,
        totalDiaExtras: {},

        totalGeralMensal: 0
    }

    for (let id in patrulha.pontos.dia) {
        let dia = patrulha.pontos.dia[id];
        dia.id = id;

        // Totais de pontos normais de reunião
        patrulha.totais.totalPontualidade += dia.pontualidade;
        patrulha.totais.totalPresenca += dia.presenca;
        patrulha.totais.totalVestuario += dia.vestuario;
        patrulha.totais.totalParticipacao += dia.participacao;
        patrulha.totais.totalEspiritoEscoteiro += dia.espiritoEscoteiro;
        patrulha.totais.totalJogoTecnico += dia.jogoTecnico;

        patrulha.totais.totalDiaReuniao[id] =
            dia.pontualidade +
            dia.presenca +
            dia.vestuario +
            dia.participacao +
            dia.espiritoEscoteiro +
            dia.jogoTecnico;
        patrulha.totais.totalGeralReuniao += patrulha.totais.totalDiaReuniao[id];

        // Ajusta penalidade (ela é negativa!)
        if (dia.penalidade > 0) {
            dia.penalidade *= -1;
        }

        // Totais de categorias extras
        patrulha.totais.totalConquistas += dia.conquistas;
        patrulha.totais.totalExtras += dia.extras;
        patrulha.totais.totalPenalidade += dia.penalidade;
        patrulha.totais.totalAtividadeExterna += dia.atividadeExterna;

        patrulha.totais.totalDiaExtras[id] =
            dia.conquistas +
            dia.extras +
            dia.penalidade +
            dia.atividadeExterna;
        patrulha.totais.totalGeralExtras += patrulha.totais.totalDiaExtras[id];
    }

    // Pontos mensais
    patrulha.totais.totalGeralMensal =
        patrulha.pontos.materialPatrulha +
        patrulha.pontos.cantoPatrulhaVirtual +
        patrulha.pontos.livrosPatrulha;

    // Total Geral
    patrulha.totais.geral =
        patrulha.totais.totalGeralReuniao +
        patrulha.totais.totalGeralExtras +
        patrulha.totais.totalGeralMensal;
}