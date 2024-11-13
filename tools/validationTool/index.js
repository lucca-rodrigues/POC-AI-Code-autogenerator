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

      const prompt = `Analise o seguinte conteúdo do arquivo ${fileName}:
      
      ${content}

      Se o conteúdo for uma lista de instruções ao invés de código fonte real:
      1. Gere o código fonte completo implementando todas as instruções
      2. Retorne "Correção sugerida:" seguido do código fonte completo
      
      Se for código fonte válido:
      1. Analise problemas e melhorias necessárias
      2. Se houver problemas, retorne "Correção sugerida:" seguido do código corrigido
      3. Se estiver OK, retorne "OK"

      Importante: 
      - Se for uma lista de instruções, SEMPRE gere o código fonte completo
      - Retorne apenas o texto da correção ou "OK", sem formatação markdown
      - Inclua todas as importações necessárias`;

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
