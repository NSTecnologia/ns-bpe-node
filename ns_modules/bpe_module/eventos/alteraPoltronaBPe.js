const nsAPI = require('../../api_module/nsAPI')
const downloadEvento = require('./downloadEvento')

const url = "https://bpe.ns.eti.br/v1/bpe/alterpol"

class Body {
    constructor(chBPe, tpAmb, dhEvento, nProt, poltrona) {
        this.chBPe = chBPe;
        this.tpAmb = tpAmb;
        this.dhEvento = dhEvento;
        this.nProt = nProt;
        this.poltrona = poltrona;
    }
}

class Response {
    constructor({ status, motivo, retEvento, erros }) {
        this.status = status;
        this.motivo = motivo;
        this.retEvento = retEvento;
        this.erros = erros
    }
}

async function sendPostRequest(conteudo, tpDown, caminhoSalvar) {

    let responseAPI = new Response(await nsAPI.PostRequest(url, conteudo))

    if (responseAPI.status == 200) {

        if (responseAPI.retEvento.cStat == 135) {

            let downloadEventoBody = new downloadEvento.Body(
                responseAPI.retEvento.chBPe,
                conteudo.tpAmb,
                tpDown,
                "ALTPOL",
                "1"
            )

            //Espera um pouco antes de fazer o download;
            await new Promise(resolve => setTimeout(resolve, 500));

            let downloadEventoResponse = await downloadEvento.sendPostRequest(downloadEventoBody, caminhoSalvar)

            return downloadEventoResponse
        }
    }

    return responseAPI
}

module.exports = { Body, sendPostRequest }