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

    Retorne um JSON com a seguinte estrutura:
    {
      "linguagem": "linguagem de programação",
      "tipo": "tipo do projeto",
      "framework": "framework principal",
      "tecnologias": ["lista", "de", "tecnologias"],
      "estrutura": {
        "diretório1": ["arquivo1.extensão", "arquivo2.extensão"],
        "diretório2": ["arquivo3.extensão", "arquivo4.extensão"]
      },
      "configuracao": {
        "arquivosConfig": ["arquivo1", "arquivo2"],
        "conteudoConfig": {
          "arquivo1": {
            // Conteúdo específico para a linguagem/framework
          },
          "arquivo2": "conteúdo em string se for arquivo simples"
        }
      },
      "comandos": {
        "instalacao": ["comando1", "comando2"],
        "build": ["comando1", "comando2"],
        "test": ["comando1"],
        "run": ["comando1"]
      },
      "dependencias": {
        "runtime": {
          "dep1": "versão",
          "dep2": "versão"
        },
        "dev": {
          "dep1": "versão",
          "dep2": "versão"
        }
      }
    }

    Considere:
    1. Use as extensões de arquivo corretas para cada linguagem
    2. Inclua arquivos de configuração específicos da linguagem/framework
    3. Configure as dependências e ferramentas apropriadas
    4. Defina os comandos de instalação, build e execução
    5. Siga as melhores práticas da linguagem escolhida
    6. Para TypeScript/JavaScript:
      - Inclua package.json, tsconfig.json, etc
    7. Para Python:
      - Inclua requirements.txt, setup.py, etc
    8. Para Java:
      - Inclua pom.xml ou build.gradle
    9. Para Go:
      - Inclua go.mod, go.sum
    10. Para outras linguagens:
        - Inclua os arquivos de configuração padrão

    Retorne apenas o JSON, sem explicações adicionais.`);
  }

  name = "project_structure_generator";
  description = "Gera a estrutura de arquivos e pastas do projeto";

  async _call(input) {
    try {
      console.log("🔄 Processando estrutura do projeto...");

      // Formata o prompt usando o template
      const formattedPrompt = await this.promptTemplate.format({
        input: input,
      });

      const result = await this.llm.invoke(formattedPrompt);

      // Limpa a resposta de possíveis marcadores markdown
      let cleanContent = result.content
        .replace(/```json\n/g, "")
        .replace(/```\n/g, "")
        .replace(/```/g, "")
        .trim();

      // Se ainda houver texto antes ou depois do JSON, tenta extrair apenas o JSON
      if (cleanContent.includes("{")) {
        const startIndex = cleanContent.indexOf("{");
        const endIndex = cleanContent.lastIndexOf("}") + 1;
        cleanContent = cleanContent.slice(startIndex, endIndex);
      }

      console.log("📄 Conteúdo limpo:", cleanContent);

      try {
        const jsonResult = JSON.parse(cleanContent);
        console.log("✅ Estrutura processada com sucesso");
        return JSON.stringify(jsonResult);
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON:", parseError);
        console.error("Conteúdo que falhou:", cleanContent);
        throw new Error("Falha ao gerar estrutura JSON válida");
      }
    } catch (error) {
      console.error("❌ Erro ao processar estrutura:", error);
      throw error;
    }
  }
}
