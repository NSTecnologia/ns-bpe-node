const nsAPI = require('../../api_module/nsAPI')

const url = "https://bpe.ns.eti.br/v1/bpe/status"

class Body {
    constructor(licencaCnpj, chBPe, tpAmb) {
        this.licencaCnpj = licencaCnpj;
        this.chBPe = chBPe;
        this.tpAmb = tpAmb;
    }
}

class Response {
    constructor({ status, motivo, retConsSitBPe, erros }) {
        this.status = status;
        this.motivo = motivo;
        this.retConsSitBPe = retConsSitBPe;
        this.erros = erros
    }
}

async function sendPostRequest(conteudo) {

    try {

        let responseAPI = new Response(await nsAPI.PostRequest(url, conteudo))
        return responseAPI

    }

    catch (error) {
        gravarLinhaLog("[ERRO_CONSULTA_SITUACAO_BPE]: " + error)
    }

}

module.exports = { Body, sendPostRequest }