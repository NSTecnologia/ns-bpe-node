# ns-bpe-node

Esta biblioteca possibilita a comunicação e o consumo da solução API para BPe da NS Tecnologia.

Para implementar esta biblioteca em seu projeto, você pode:

1. Realizar a instalação do [pacote](https://www.npmjs.com/package/ns-bpe-node) através do npm:

       npm install ns-bpe-node

2. Realizar o download da biblioteca pelo [GitHub]https://github.com/NSTecnologia/ns-bpe-node/archive/refs/heads/main.zip) e adicionar a pasta "ns-modules" em seu projeto.

# Exemplos de uso do pacote

Para que a comunicação com a API possa ser feita, é necessário informar o seu Token no cabeçalho das requisições. 

Para isso, crie um arquivo chamado `configParceiro.js`, e nele adicione:

       const token = ""
       const CNPJ = ""

       module.exports = {token, CNPJ}
       
Dessa forma, o pacote conseguirá importar as suas configurações, onde você estará informando o token da software house e o cnpj do emitente.

## Emissão

Para realizarmos a emissão de uma NFe, vamos utilizar os seguintes métodos.

Primeiramente, vamos fazer referencia da classe *emitirSincrono*, para utilizarmos o método **emitirBPeSincrono**

       const nsAPI = require("./ns_modules/bpe_module/emissao/emitirSincrono")

O segundo passo é importar, ou construir o arquivo de emissão em **.json** do BPe.

       const bpeJSON = require("./BPeEmit.json")
           
Apos isso, vamo utilizar o método **sendPostRequest** da classe *EmissaoSincrona* para realizar o envio deste documento BPe para a API.
Este método realiza a emissão, a consulta de status de processamento e o download de forma sequencial.

       nsAPI.emitirBPeSincrono(bpeJSON, "2", "XP", "./Bpe").then((retorno)=>{console.log(retorno)})

Os parâmetros deste método são:

+ *BPeEmit* = objeto BPe que será serializado para envio;
+ *2* = tpAmb = ambiente onde será autorizado a NFe. *1 = produção, 2 = homologação / testes* ;
+ *"XP"* = tpDown = tipo de download, indicando quais os tipos de arquivos serão obtidos no Download;
+ *"./BPe"* = diretório onde serão salvos os documentos obtidos no download;

O retorno deste método é um objeto json contendo um compilado dos retornos dos métodos realizados pela emissão sincrona:

       ResponseSincrono {
			statusEnvio: 200,
			statusConsulta: 200,
			statusDownload: 200,
			cStat: '100',
			motivo: 'Consulta realizada com sucesso',
			xMotivo: 'Autorizado o uso do BP-e',
			nsNRec: 476034,
			chBPe: '43220507364617000135630600000000101813509436',
			nProt: '143220000151842',
			xml: '<?xml version="1.0" encoding="utf-8"?><bpeProc versao="1.00" xmlns="http://www.portalfiscal.inf.br/bpe"><BPe><infBPe versao="1.00" Id="BPe43220507364617000135630600000000101813509436">
		   json: undefined, // json do BPe autorizada quando tpDown = "J", ou "JP"
           pdf: undefined, // base64 do PDF da NFe ( DABPE ) autorizada quando tpDown = "P", "XP", "JP"
           erros: undefined // array de erros quando a comunicação, emissão, ou processamento apresentar erros
         }
       }
    
Podemos acessarmos os dados de retorno e aplicarmos validações da seguinte forma. Tenhamos como exemplo:

       if ((emissaoResponse.status == 200) || (emissaoResponse.status == -6 || (emissaoResponse.status == -7))){
        
        respostaSincrona.statusEnvio = emissaoResponse.status
		//Se o status for 200, -6 ou -7 fará a consulta de status de processamento;
        let statusBody = new statusProcessamento.Body(
            configParceiro.CNPJ,
            emissaoResponse.nsNRec,
            tpAmb
        )
		//Aqui é determinado um tempo para que aguarde antes de fazer a consulta;
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let statusResponse = await statusProcessamento.sendPostRequest(statusBody)

        respostaSincrona.statusConsulta = statusResponse.status

        if ((statusResponse.status == 200)) {

            respostaSincrona.cStat = statusResponse.cStat
            respostaSincrona.xMotivo = statusResponse.xMotivo
            respostaSincrona.motivo = statusResponse.motivo
            respostaSincrona.nsNRec = emissaoResponse.nsNRec

            if ((statusResponse.cStat == 100) || (statusResponse.cStat == 150)) {

                respostaSincrona.chBPe = statusResponse.chBPe
                respostaSincrona.nProt = statusResponse.nProt
				//Se o status da consulta for 200 e o cStat da sefaz for 100 ou 150 é montada e feita a requsição de download;
                let downloadBody = new download.Body(
                    statusResponse.chBPe,
                    tpDown,
                    tpAmb
                )

                let downloadResponse = await download.sendPostRequest(downloadBody, caminhoSalvar)

                if (downloadResponse.status == 200) {
                    respostaSincrona.statusDownload = downloadResponse.status
                    respostaSincrona.xml = downloadResponse.xml
                    respostaSincrona.json = downloadResponse.json
                    respostaSincrona.pdf = downloadResponse.pdf
                }

                else {
                    respostaSincrona.motivo = downloadResponse.motivo;
                }
            }

            else {
                respostaSincrona.motivo = statusResponse.motivo;
                respostaSincrona.xMotivo = statusResponse.xMotivo;
            }
        }

        else if (statusResponse.status == -2) {
            respostaSincrona.cStat = statusResponse.cStat;
            respostaSincrona.erros = statusResponse.erro;
        }

        else {
            motivo = statusProcessamento.motivo;
        }
    }

    else if ((emissaoResponse.status == -4) || (emissaoResponse.status == -2)) {

        respostaSincrona.motivo = emissaoResponse.motivo

        try {
            respostaSincrona.erros = emissaoResponse.erros
        }

        catch (error) {
            console.log(error);
        }
    }

    else if ((emissaoResponse.status == -999) || (emissaoResponse.status == -5)) {
        respostaSincrona.motivo = emissaoResponse.motivo
    }

    else {

        try {
            respostaSincrona.motivo = emissaoResponse.motivo
        }

        catch (error) {

            respostaSincrona.motivo = JSON.stringify("ERRO: " + error + "\r\n" + emissaoResponse)
        }
    }

    return respostaSincrona
}

## Eventos

### Cancelar BPe

Para realizarmos um cancelamento de um BPe, devemos gerar o objeto do corpo da requisição e depois, fazer a chamada do método. Veja um exemplo:
       
       const cancelarBPe = require('./ns_modules/bpe_module/eventos/cancelamentoBPe')

       let corpo = new cancelarNFe.body(
           "43220507364617000135630600000000071963550061",
           "2",
           "2022-05-16T10:43:00-03:00",
           "143220000150217",
           "CANCELAMENTO REALIZADO PARA TESTES DE INTEGRACAO EXEMPLO NODE JS"
       )

       cancelarBPe.sendPostRequest(corpo,"X", "./Evento/").then(getResponse => { console.log(getResponse) })
        
Os parâmetros informados no método são:

+ *requisicaoCancelamento* =  Objeto contendo as informações do corpo da requisição de cancelamento;
+ *"XP"* = tpDown = tipo de download, indicando quais os tipos de arquivos serão obtidos no download do evento de cancelamento;
+ *"./Evento/"* = diretório onde serão salvos os arquivos obtidos no download do evento de cancelamento;
+ *true* = exibeNaTela = parâmetro boolean que indica se será exibido na tela, ou não, o PDF obtido no download do evento de cancelamento;

### Altera Poltrona do BPe

Para emitirmos um evento de alteração de poltrona de um BPe, devemos gerar o objeto do corpo da requisição, utilizando a classe *alteraPoltronaBPe.Body*, e utilzar o método *alteraPoltronaBPe.sendPostRequest*, da seguinte forma:

       const alteraPoltronaBPe = require('./ns_modules/bpe_module/eventos/alteraPoltronaBPe')

       llet corpo = new alteraPoltronaBPe.Body(
			"43220507364617000135630600000000071963550061",
			"2",
			"2022-05-16T10:43:00-03:00",
			"143220000150217",
			"25",
		)

       alteraPoltronaBPe.sendPostRequest(corpo,"X", "./Evento/").then(getResponse => { console.log(getResponse) })
        
Os parâmetros informados no método são:

+ *corpo* =  Objeto contendo as informações do corpo da requisição da carta de correção;
+ *"X"* = tpDown = tipo de download, indicando quais os tipos de arquivos serão obtidos no download do evento de alteração de poltrona;
+ *"Documentos/NFe/Eventos"* = diretório onde serão salvos os arquivos obtidos no download do evento de alteração de poltrona;

### Excesso de bagagem BPe

Para emitirmos um evento Excesso de bagagem BPe, devemos gerar o objeto do corpo da requisição, utilizando a classe *excessoBagagem.Body*, e utilizar o método *excessoBagagem.sendPostRequest*, da seguinte forma:

		const excessoBagagem = require('./ns_modules/bpe_module/eventos/excessoBagagemBPe')
		
       let corpo = new excessoBagagem.Body(
		 "43220507364617000135630600000000071963550061",
         "2",
		 "2022-05-16T10:43:00-03:00",
		 "143220000150217",
		 "2",
		 "10.00",
		)

		excessoBagagem.sendPostRequest(corpo,"X", "./Evento/").then(getResponse => { console.log(getResponse) })
		
Os parâmetros informados no método são:

+ *excessoBagagem* =  Objeto contendo as informações do corpo da requisição de inutilização;
+ *"X"* = tpDown = tipo de download, indicando quais os tipos de arquivos serão obtidos no download do evento de inutilização;
+ *"./Eventos/"* = diretório onde serão salvos os arquivos obtidos no download do evento de inutilização;

### Não embarque BPe

Para emitirmos um evento de Não embarque no BPe, devemos gerar o objeto do corpo da requisição, utilizando a classe *naoEmbarqueBPe.Body*, e utilizar o método *naoEmbarqueBPe.sendPostRequest*, da seguinte forma:

       const naoEmbarqueBPe = require('./ns_modules/bpe_module/eventos/naoEmbarqueBPe')

		let corpo = new naoEmbarqueBPe.Body(
			"43220507364617000135630600000000071963550061",
			"2",
			"2022-05-16T10:43:00-03:00",
			"143220000150217",
			"Não embarque para teste de integração",
		)

	  naoEmbarqueBPe.sendPostRequest(corpo,"X", "./Evento/").then(getResponse => { console.log(getResponse) })
		
Os parâmetros informados no método são:

+ *naoEmbarqueBPe* =  Objeto contendo as informações do corpo da requisição de inutilização;
+ *"X"* = tpDown = tipo de download, indicando quais os tipos de arquivos serão obtidos no download do evento de inutilização;
+ *"./Eventos/"* = diretório onde serão salvos os arquivos obtidos no download do evento de inutilização;

## Utilitários

Ainda com esta biblioteca, é possivel acessar método utilitários da API de BPe. Veja exemplos:
        
### Consultar Situação BPe

       const consSitBPe = require('./ns_modules/bpe_module/util/consultarSituacaoBPe')

		let corpo = new consSitBPe.Body(
			"07364617000135",
			"43220507364617000135630600000000071963550061",
			"2",
		)

	   consSitBPe.sendPostRequest(corpo).then(getResponse => { console.log(getResponse) })

### Gerar PDF através do XML autorizado
        
			const gerarPDF = require('./ns_modules/bpe_module/util/gerarPDF')

			let corpo = new gerarPDF.Body(
				"<?xml version=\"1.0\" encoding=\"utf-8\"?><nfeProc versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\"><NFe>...</NFe><protNFe versao=\"4.00\">...</protNFe></nfeProc>",
				"true",
				"true"
			)

		   gerarPDF.sendPostRequest(corpo).then(getResponse => { console.log(getResponse) })
        
### Listagem de nsNRec's vinculados à um BPe

       const listarNSNRec = require('./ns_modules/bpe_module/util/listarNSNRec')

		let corpo = new listarNSNRec.Body(
		"43220507364617000135630600000000071963550061",
		)

	  listarNSNRec.sendPostRequest(corpo).then(getResponse => { console.log(getResponse) })


### Informações Adicionais

Para saber mais sobre o projeto BPe API da NS Tecnologia, consulte a [documentação](https://docsnstecnologia.wpcomstaging.com/docs/ns-bpe/)


