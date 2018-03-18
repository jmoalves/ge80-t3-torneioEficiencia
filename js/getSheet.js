// Node dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
//

const patrulhas = {
    "Tiranossauro": "tirano",
    "Tigre Dente de Sabre": "tds",
    "Titanossauro": "titano",
    "Triceratops": "triceraptor"
}

const books = {
    "2017": "1csoLFxVi8fWZFTEbRBX4AQcVejd7qqfV2dBsTjt9pJk" // 2017
};

const sheets = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro"
};

const range = "A3:R50";
const api_key = fs.readFileSync(path.resolve(os.homedir(), ".google/apiKey"));

console.log("Using API_KEY " + api_key);

for (var book in books) {
    var bookUrl = "https://sheets.googleapis.com/v4/spreadsheets/" + books[book];
    for (var sheet in sheets) {
        var sheetUrl = bookUrl + "/values/" + sheets[sheet] + "!" + range + "?majorDimension=ROWS&key=" + api_key
        var ciclo = book + "-" + sheet;
        var cicloNome = sheets[sheet] + " " + book;
        var filename = "sheets/" + ciclo + ".json";
        obterPlanilha(sheetUrl, ciclo, cicloNome, filename);
    }
}

function obterPlanilha(sheetUrl, ciclo, cicloNome, filename) {
    console.log("URL: " + sheetUrl);

    https.get(encodeURI(sheetUrl), (res) => {
        res.on('error', (error) => {
            console.log('HTTP ERROR: ' + JSON.stringify(error, null, 3));
            return;
        });

        if (res.statusCode !== 200) {
            console.log(res.statusCode + ' for ' + sheetUrl);
            return;
        }

        console.log("GET " + filename);
        res.pipe(fs.createWriteStream(filename))
            .on('error', (error) => {
                console.log('WRITE ERROR: ' + JSON.stringify(error, null, 3));
                return;
            })
            .on('finish', () => {
                gerarCiclo(ciclo, cicloNome, filename);
            });
    });
}

function gerarCiclo(ciclo, cicloNome, filename) {
    fs.lstat(filename, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return;
            }

            throw err;
        }

        if (!stats.isFile()) {
            return;
        }

        lerCiclo(ciclo, cicloNome, filename);
    });
}

function lerCiclo(ciclo, cicloNome, filename) {
    fs.readFile(filename, (err, data) => {
        if (err) throw err;
        var json = JSON.parse(data);
        obterCiclo(ciclo, cicloNome, json);
    });
}

function obterCiclo(ciclo, cicloNome, json) {
    // console.log("");
    // console.log(ciclo + " => " + JSON.stringify(json));

    var cicloObj = {};
    cicloObj[ciclo] = {
        "id": ciclo,
        "nome": cicloNome,
        "patrulha": {}
    }

    // console.log("P1: " + JSON.stringify(cicloObj));
    var patrulha = undefined;
    var patrulhaObj = undefined;
    var cabecalho = {};

    for (var x in json.values) {
        var linha = json.values[x];
        if (x == 0) {
            cabecalho = obtemCabecalho(linha);
        } else if (x == 1) {
            cabecalho.dia = obtemDia(linha);
        } else {
            if (linha[0] !== "") {
                if (patrulhaObj) {
                    cicloObj[ciclo].patrulha[patrulha] = patrulhaObj;
                }
                patrulha = patrulhas[linha[0]];
                patrulhaObj = {
                    pontos: {
                        cantoPatrulhaVirtual: 0,
                        livrosPatrulha: 0,
                        materialPatrulha: 0,

                        dia: {}
                    }
                };
            }

            var dia = linha[cabecalho.dia];
            if (dia) {
                if (dia.length == 1) {
                    dia = "0" + dia;
                }

                // console.log("DIA: " + dia);
                patrulhaObj.pontos.dia[dia] = {
                    pontualidade: 0,
                    presenca: 0,
                    vestuario: 0,
                    participacao: 0,
                    espiritoEscoteiro: 0,
                    jogoTecnico: 0,
                    conquistas: 0,
                    extras: 0,
                    penalidade: 0,
                    atividadeExterna: 0
                };

                if (linha[cabecalho.pontualidade] !== '')
                    patrulhaObj.pontos.dia[dia].pontualidade = Number(linha[cabecalho.pontualidade]);

                if (linha[cabecalho.presenca] !== '')
                    patrulhaObj.pontos.dia[dia].presenca = Number(linha[cabecalho.presenca]);

                if (linha[cabecalho.vestuario] !== '')
                    patrulhaObj.pontos.dia[dia].vestuario = Number(linha[cabecalho.vestuario]);

                if (linha[cabecalho.participacao] !== '')
                    patrulhaObj.pontos.dia[dia].participacao = Number(linha[cabecalho.participacao]);

                if (linha[cabecalho.espiritoEscoteiro] !== '')
                    patrulhaObj.pontos.dia[dia].espiritoEscoteiro = Number(linha[cabecalho.espiritoEscoteiro]);

                if (linha[cabecalho.jogoTecnico] !== '')
                    patrulhaObj.pontos.dia[dia].jogoTecnico = Number(linha[cabecalho.jogoTecnico]);

                if (linha[cabecalho.conquistas] !== '')
                    patrulhaObj.pontos.dia[dia].conquistas = Number(linha[cabecalho.conquistas]);

                if (linha[cabecalho.extras] !== '')
                    patrulhaObj.pontos.dia[dia].extras = Number(linha[cabecalho.extras]);

                if (linha[cabecalho.penalidade] !== '')
                    patrulhaObj.pontos.dia[dia].penalidade = Number(linha[cabecalho.penalidade]);

                if (linha[cabecalho.atividadeExterna] !== '')
                    patrulhaObj.pontos.dia[dia].atividadeExterna = Number(linha[cabecalho.atividadeExterna]);
            }

            if (linha[cabecalho.cantoPatrulhaVirtual] && linha[cabecalho.cantoPatrulhaVirtual] !== '') {
                patrulhaObj.pontos.cantoPatrulhaVirtual = Number(linha[cabecalho.cantoPatrulhaVirtual]);
            }

            if (linha[cabecalho.livrosPatrulha] && linha[cabecalho.livrosPatrulha] !== '') {
                patrulhaObj.pontos.livrosPatrulha = Number(linha[cabecalho.livrosPatrulha]);
            }

            if (linha[cabecalho.materialPatrulha] && linha[cabecalho.materialPatrulha] !== '') {
                patrulhaObj.pontos.materialPatrulha = Number(linha[cabecalho.materialPatrulha]);
            }
        }
    }

    if (patrulhaObj) {
        cicloObj[ciclo].patrulha[patrulha] = patrulhaObj;
    }

    // console.log("CABEC: " + JSON.stringify(cabecalho));
    console.log("");
    console.log(ciclo + " => " + JSON.stringify(cicloObj));
    gravarCiclo(ciclo, cicloObj);
}

function obtemCabecalho(linha) {
    var cabecalho = {
        cantoPatrulhaVirtual: 0,
        livrosPatrulha: 0,
        materialPatrulha: 0,
        pontualidade: 0,
        presenca: 0,
        vestuario: 0,
        participacao: 0,
        espiritoEscoteiro: 0,
        jogoTecnico: 0,
        conquistas: 0,
        extras: 0,
        penalidade: 0,
        atividadeExterna: 0
    }

    for (var c in linha) {
        switch (linha[c]) {
            case 'Pontualidade':
                cabecalho.pontualidade = c;
                break;

            case 'Presença':
                cabecalho.presenca = c;
                break;

            case 'Vestuário':
                cabecalho.vestuario = c;
                break;

            case 'Participação':
                cabecalho.participacao = c;
                break;

            case 'Espírito Escoteiro':
                cabecalho.espiritoEscoteiro = c;
                break;

            case 'Jogo Técnico':
                cabecalho.jogoTecnico = c;
                break;

            case 'Conquistas':
                cabecalho.conquistas = c;
                break;

            case 'Extras':
                cabecalho.extras = c;
                break;

            case 'Penalidade':
                cabecalho.penalidade = c;
                break;

            case 'Ativ Externa':
                cabecalho.atividadeExterna = c;
                break;

            case 'Material de Patrulha':
                cabecalho.materialPatrulha = c;
                break;

            case 'Canto de Patrulha Virtual':
                cabecalho.cantoPatrulhaVirtual = c;
                break;

            case 'Livros de Patrulha':
                cabecalho.livrosPatrulha = c;
                break;
        }
    }

    return cabecalho;
}

function obtemDia(linha) {
    for (var c in linha) {
        if (linha[c] == 'Dia') {
            return c;
        }
    }
}

function gravarCiclo(ciclo, cicloObj) {
    var filename = "ciclos/" + ciclo + '.json';
    fs.writeFile(filename, JSON.stringify(cicloObj, null, 3), (err) => {
        if (err) throw err;
    });
}