import { Tool } from "@langchain/core/tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

export class ValidationTool extends Tool {
  constructor(llm) {
    super();
    this.llm = llm;
  }

  name = "code_validator";
  description = "Valida o conteúdo de um arquivo";

  async _call(input) {
    try {
      const { fileName, content } = JSON.parse(input);

      const prompt = `Analise o seguinte conteúdo do arquivo ${fileName} e identifique erros ou melhorias:
      
      Conteúdo:
      ${content}

      Se houver problemas, retorne "Correção sugerida:" seguido das correções.
      Caso contrário, retorne "OK".

      Importante: Retorne apenas o texto da correção ou "OK", sem formatação markdown ou explicações adicionais.`;

      const result = await this.llm.invoke(prompt);

      // Extrair e limpar o conteúdo da mensagem AI
      let validationResult = result.content.replace(/```\n/g, "").replace(/```/g, "").trim();

      console.log(`🔍 Resultado da validação para ${fileName}:`, validationResult);

      return validationResult;
    } catch (error) {
      console.error(`❌ Erro ao validar ${JSON.parse(input).fileName}:`, error);
      throw new Error(`Falha na validação do arquivo: ${error.message}`);
    }
  }
}
