const nsAPI = require('../../api_module/nsAPI')
var fs = require('fs');
const util = require("../../api_module/util")
'use strict';

//POST type URL
const url = "https://bpe.ns.eti.br/v1/bpe/get"

class Body {
    constructor(chBPe, tpDown, tpAmb) {
        this.chBPe = chBPe;
        this.tpDown = tpDown;
        this.tpAmb = tpAmb;
    }
}

class Response {
    constructor({ status, motivo, chBPe, xml, pdf, erro }) {
        this.status = status;
        this.motivo = motivo;
        this.chBPe = chBPe;
        this.xml = xml;
        this.pdf = pdf;
        this.json = JSON.stringify();
        this.erro = erro
    }
}

async function sendPostRequest(body, caminho) {

    try {

        let responseAPI = new Response(await nsAPI.PostRequest(url, body))

        if (responseAPI.json != null) {
            util.salvarArquivo(caminho, responseAPI.chBPe, "-cteProc.json", responseAPI.json)
        }

        if (responseAPI.pdf != null) {
            let data = responseAPI.pdf;
            let buff = Buffer.from(data, 'base64');
            util.salvarArquivo(caminho, responseAPI.chBPe, "-cteProc.pdf", buff)
        }

        if (responseAPI.xml != null) {
            util.salvarArquivo(caminho, responseAPI.chBPe, "-cteProc.xml", responseAPI.xml)
        }

        return responseAPI

    } 
    
    catch (error) {
        util.gravarLinhaLog("[ERRO_DOWNLOAD]: " + error)
        return error
    }




}

module.exports = { Body, sendPostRequest }

