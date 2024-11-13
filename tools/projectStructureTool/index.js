import { Tool } from "@langchain/core/tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export class ProjectStructureTool extends Tool {
  constructor(llm) {
    super();
    this.llm = llm;

    // Define o template do prompt
    this.promptTemplate = ChatPromptTemplate.fromTemplate(`Analise o seguinte requisito de projeto e gere uma estrutura completa e moderna:

    Requisito: {input}

    Primeiro, determine:
    1. A linguagem de programação (padrão TypeScript se não especificado)
    2. O framework ou biblioteca principal
    3. O tipo de projeto (backend, frontend, fullstack, etc)

    Retorne um JSON válido seguindo exatamente esta estrutura (substitua os valores de exemplo pelos valores reais):

    {{
      "linguagem": "typescript",
      "tipo": "backend",
      "framework": "express",
      "tecnologias": ["nodejs", "express", "typescript"],
      "estrutura": {{
        "src": ["index.ts", "app.ts"],
        "controllers": ["userController.ts"],
        "models": ["userModel.ts"]
      }},
      "configuracao": {{
        "arquivosConfig": ["tsconfig.json", "package.json"],
        "conteudoConfig": {{
          "tsconfig": "configuração typescript",
          "package": "configuração npm"
        }}
      }},
      "comandos": {{
        "instalacao": ["npm install"],
        "build": ["npm run build"],
        "test": ["npm test"],
        "run": ["npm start"]
      }},
      "dependencias": {{
        "runtime": {{
          "express": "^4.18.2",
          "typescript": "^5.0.0"
        }},
        "dev": {{
          "ts-node": "^10.9.1",
          "@types/express": "^4.17.17"
        }}
      }}
    }}

    Considere:
    1. Use as extensões de arquivo corretas para cada linguagem
    2. Inclua arquivos de configuração específicos da linguagem/framework
    3. Configure as dependências e ferramentas apropriadas
    4. Defina os comandos de instalação, build e execução
    5. Siga as melhores práticas da linguagem escolhida

    Retorne apenas o JSON válido, sem explicações adicionais.`);
  }

  name = "project_structure_generator";
  description = "Gera a estrutura de arquivos e pastas do projeto";

  async _call(input) {
    try {
      console.log("🔄 Processando estrutura do projeto...");

      const chain = RunnableSequence.from([this.promptTemplate, this.llm, new JsonOutputParser()]);

      const result = await chain.invoke({
        input: input,
      });

      console.log("✅ Estrutura processada com sucesso");
      return JSON.stringify(result);
    } catch (error) {
      console.error("❌ Erro ao processar estrutura:", error);
      throw new Error(`Falha ao gerar estrutura do projeto: ${error.message}`);
    }
  }
}
