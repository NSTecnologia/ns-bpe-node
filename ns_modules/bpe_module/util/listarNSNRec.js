const nsAPI = require('../../api_module/nsAPI')
const url = "https://bpe.ns.eti.br/v1/util/listar/nsnrecs"

class Body {
    constructor(chBPe) {
        this.chBPe = chBPe;
    }
}

class Response {
    constructor({ status, motivo, nsNRecs, erros }) {
        this.status = status;
        this.motivo = motivo;
        this.nsNRecs = nsNRecs;
        this.erros = erros
    }
}

async function sendPostRequest(conteudo) {

    try {

        let responseAPI = new Response(await nsAPI.PostRequest(url, conteudo))
        return responseAPI

    }

    catch (error) {
        gravarLinhaLog("[ERRO_LISTAGEM_NSNREC]: " + error)
    }

}

module.exports = { Body, sendPostRequest }
