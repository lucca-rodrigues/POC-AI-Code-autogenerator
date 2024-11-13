import { Tool } from "@langchain/core/tools";

export class FileContentTool extends Tool {
  constructor(llm) {
    super();
    this.llm = llm;
  }

  name = "file_content_generator";
  description = "Gera o conteúdo para um arquivo específico";

  async _call(input) {
    try {
      const { fileName, projectType } = JSON.parse(input);

      const prompt = `Você é um desenvolvedor expert. Gere o código completo e funcional para o arquivo ${fileName} em um projeto ${projectType}.
                      Requisitos:
                      1. Gere APENAS o código fonte, sem comentários sobre o que fazer
                      2. O código deve ser completo e funcional
                      3. Use as melhores práticas de programação
                      4. Siga os padrões modernos de desenvolvimento
                      5. Inclua importações necessárias
                      6. Use tipagem adequada (TypeScript)
                      7. Implemente tratamento de erros
                      8. Siga princípios SOLID
                      9. Inclua validações necessárias

                      Importante:
                      - NÃO inclua comentários sobre o que deveria ser feito
                      - NÃO liste melhorias ou sugestões
                      - APENAS gere o código fonte funcional
                      - Se for um controller ou service, implemente todos os métodos CRUD
                      - Se for um modelo, inclua todas as propriedades e validações
                      - Se for um middleware, implemente a lógica completa

                      Retorne apenas o código fonte, sem explicações ou markdown.`;

      const result = await this.llm.invoke(prompt);

      // Limpar o resultado de possíveis formatações
      let content = result.content
        .replace(/```typescript\n/g, "")
        .replace(/```ts\n/g, "")
        .replace(/```javascript\n/g, "")
        .replace(/```\n/g, "")
        .replace(/```/g, "")
        .trim();

      // Se o conteúdo parecer ser uma lista de instruções em vez de código
      if (!content.includes("import") && !content.includes("export") && !content.includes("class") && !content.includes("interface")) {
        console.log("⚠️ Conteúdo parece ser instruções em vez de código. Gerando novamente...");

        // Tenta gerar novamente com um prompt mais específico
        const retryPrompt = `Gere o código fonte real e completo para ${fileName}. 
                              NÃO dê instruções ou sugestões.
                              APENAS o código fonte funcional.

                              Por exemplo, se for um controller, deve ser algo como:

                              import { Request, Response } from 'express';
                              import { CardService } from '../services/CardService';

                              export class CardController {
                                constructor(private cardService: CardService) {}

                                async create(req: Request, res: Response) {
                                  try {
                                    const card = await this.cardService.create(req.body);
                                    return res.status(201).json(card);
                                  } catch (error) {
                                    return res.status(400).json({ error: error.message });
                                  }
                                }
                                // ... outros métodos
                              }

                              Gere o código completo agora:`;

        const retryResult = await this.llm.invoke(retryPrompt);
        content = retryResult.content
          .replace(/```typescript\n/g, "")
          .replace(/```ts\n/g, "")
          .replace(/```javascript\n/g, "")
          .replace(/```\n/g, "")
          .replace(/```/g, "")
          .trim();
      }

      console.log(`📝 Conteúdo gerado para ${fileName}`);
      return content;
    } catch (error) {
      console.error(`❌ Erro ao gerar conteúdo para ${JSON.parse(input).fileName}:`, error);
      throw new Error(`Falha ao gerar conteúdo do arquivo: ${error.message}`);
    }
  }
}
