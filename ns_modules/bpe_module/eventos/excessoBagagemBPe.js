const nsAPI = require('../../api_module/nsAPI')
const util = require('../../api_module/util')

const url = "https://bpe.ns.eti.br/v1/bpe/excessobag"

class Body {
    constructor(chBPe, tpAmb, dhEvento, nProt, qBagagem, vTotBag) {
        this.chBPe = chBPe;
        this.tpAmb = tpAmb;
        this.dhEvento = dhEvento;
        this.nProt = nProt;
        this.qBagagem = qBagagem;
        this.vTotBag = vTotBag
    }
}

class Response {
    constructor({ status, motivo, retEvento, erro }) {
        this.status = status;
        this.motivo = motivo;
        this.retEvento = retEvento;
        this.erro = erro
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
                "EXCBAG",
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