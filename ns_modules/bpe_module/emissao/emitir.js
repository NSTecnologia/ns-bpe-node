const nsAPI = require('../../api_module/nsAPI')
const util = require('../../api_module/util')

//POST type URL
const url = "https://bpe.ns.eti.br/v1/bpe/issue"

class Response {
    constructor({ status, motivo, nsNRec, erros}) {
        this.status = status;
        this.motivo = motivo;
        this.nsNRec = nsNRec;
        this.erros = erros;
    }
}

async function sendPostRequest(conteudo) {

    try {
        let responseAPI = new Response(await nsAPI.PostRequest(url, conteudo))
        return responseAPI
    }

    catch (error) {
        util.gravarLinhaLog("[ERRO_EMISSAO]: " + error)
        return error
    }
}

module.exports = { sendPostRequest }