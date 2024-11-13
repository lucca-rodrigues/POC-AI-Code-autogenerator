import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import { ProjectStructureTool, FileContentTool, ValidationTool, WebScrapingTool, SerperTool } from "./tools/index.js";

dotenv.config();

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// const llm = new ChatGroq({
//   modelName: "llama3-8b-8192",
//   temperature: 0.7,
//   groqApiKey: process.env.GROQ_API_KEY,
// });

async function createFile(filePath, content) {
  console.log(`📂 Verificando/criando caminho para: ${filePath}`);

  // Remove .backup do nome do arquivo se existir
  const cleanPath = filePath.replace(".backup", "");

  await fs.ensureFile(cleanPath);
  await fs.writeFile(cleanPath, content, "utf8");
  console.log(`✅ Arquivo criado com sucesso: ${cleanPath}`);
}

export async function generateProject(userPrompt) {
  try {
    console.log("\n🚀 Iniciando geração do projeto...");
    console.log(`📝 Prompt recebido: "${userPrompt}"\n`);

    const tools = [
      new ProjectStructureTool(llm),
      new FileContentTool(llm),
      new ValidationTool(llm),
      new WebScrapingTool(),
      new SerperTool(process.env.SERPER_API_KEY),
    ];

    // Buscar informações atualizadas usando Serper
    console.log("🔍 Buscando informações atualizadas...");
    const serper = tools[4];

    const searchQueries = [
      `${userPrompt} best practices 2024/2025`,
      `${userPrompt} modern architecture example`,
      `${userPrompt} latest npm packages`,
    ];

    let searchContext = "";
    for (const query of searchQueries) {
      try {
        const results = await serper._call(query);
        searchContext += `\nResultados para "${query}":\n${results}\n`;
      } catch (error) {
        console.warn(`⚠️ Falha na busca para "${query}": ${error.message}`);
      }
    }

    // Buscar documentação específica usando WebScraping
    console.log("🌐 Buscando documentação oficial...");
    const webScraper = tools[3];
    const docsUrls = [
      `https://nodejs.org/en/docs/guides`,
      `https://expressjs.com/en/guide/routing.html`,
      `https://www.npmjs.com/search?q=${encodeURIComponent(userPrompt)}`,
    ];

    let docsContext = "";
    for (const url of docsUrls) {
      try {
        const content = await webScraper._call(url);
        docsContext += `\nConteúdo de ${url}:\n${content}\n`;
      } catch (error) {
        console.warn(`⚠️ Não foi possível acessar ${url}: ${error.message}`);
      }
    }

    // Enriquecendo o prompt com todas as informações
    const enrichedPrompt = `
      ${userPrompt}
      
      Informações atualizadas encontradas na web:
      ${searchContext}
      
      Documentação oficial e exemplos:
      ${docsContext}
      
      Por favor, use estas informações para gerar um projeto que:
      1. Siga as práticas mais recentes e atualizadas
      2. Use as versões mais recentes das dependências
      3. Implemente padrões modernos de desenvolvimento
      4. Considere aspectos de segurança e performance
      5. Siga as recomendações oficiais da documentação
    `;

    // Gerando estrutura do projeto com contexto enriquecido
    console.log("🔨 Gerando estrutura do projeto...");
    const structureResult = await tools[0]._call(enrichedPrompt);
    const projectStructure = JSON.parse(structureResult);
    console.log("📋 Estrutura gerada:", JSON.stringify(projectStructure, null, 2));

    const resultPath = path.join(process.cwd(), "result");
    await fs.ensureDir(resultPath);

    // Criar arquivos de configuração primeiro
    if (projectStructure.configuracao?.arquivosConfig) {
      console.log("\n⚙️ Criando arquivos de configuração...");

      // Criar primeiro os arquivos de configuração principais
      for (const configFile of projectStructure.configuracao.arquivosConfig) {
        const configPath = path.join(resultPath, configFile);
        const configContent = projectStructure.configuracao.conteudoConfig[configFile];

        if (configContent) {
          console.log(`📝 Gerando ${configFile}...`);
          await createFile(configPath, typeof configContent === "object" ? JSON.stringify(configContent, null, 2) : configContent);
          console.log(`✅ ${configFile} criado com sucesso`);
        }
      }

      // Executar comandos de instalação se necessário
      if (projectStructure.comandos?.instalacao) {
        console.log("\n📦 Executando comandos de instalação...");
        for (const comando of projectStructure.comandos.instalacao) {
          console.log(`⚡ Executando: ${comando}`);
          // Aqui você pode adicionar a lógica para executar os comandos
          // Por exemplo, usando child_process.exec
        }
      }
    }

    // Criar estrutura de diretórios e arquivos
    console.log("\n📂 Iniciando criação de arquivos e pastas...");
    for (const [dir, files] of Object.entries(projectStructure.estrutura)) {
      const dirPath = path.join(resultPath, dir);
      console.log(`📂 Verificando/criando diretório: ${dirPath}`);
      await fs.ensureDir(dirPath);
      console.log(`✅ Diretório verificado/criado: ${dir}`);

      for (const file of files) {
        console.log(`\n📄 Processando arquivo: ${file}`);
        const filePath = path.join(dirPath, file);

        // Gerando conteúdo
        console.log(`⚙️  Gerando conteúdo para ${file}...`);
        const content = await tools[1]._call(
          JSON.stringify({
            fileName: file,
            projectType: userPrompt,
          })
        );

        await createFile(filePath, content);

        // Validando conteúdo
        console.log(`🔍 Validando conteúdo de ${file}...`);
        const validationResult = await tools[2]._call(
          JSON.stringify({
            fileName: file,
            content: await fs.readFile(filePath, "utf8"),
          })
        );

        if (validationResult.includes("Correção sugerida:")) {
          console.log(`⚠️  Correções necessárias em ${file}, aplicando...`);
          const correctedContent = validationResult.split("Correção sugerida:")[1].trim();
          await createFile(filePath, correctedContent);
          console.log(`✅ Correções aplicadas em ${file}`);
        } else {
          console.log(`✅ Arquivo ${file} validado sem correções necessárias`);
        }
      }
    }

    console.log("\n🎉 Projeto gerado com sucesso!");
    console.log("📋 Informações do projeto:");
    console.log(`🔤 Linguagem: ${projectStructure.linguagem}`);
    console.log(`🛠️  Framework: ${projectStructure.framework}`);
    console.log(`📦 Dependências necessárias:`, projectStructure.dependencias);
    console.log(`⚡ Comandos disponíveis:`, projectStructure.comandos);
    console.log(`📂 Caminho do projeto: ${resultPath}\n`);

    return {
      message: "Projeto gerado com sucesso e validado!",
      linguagem: projectStructure.linguagem,
      framework: projectStructure.framework,
      tipo: projectStructure.tipo,
      tecnologias: projectStructure.tecnologias,
      comandos: projectStructure.comandos,
      resultPath: resultPath,
    };
  } catch (error) {
    console.error("\n❌ Erro durante a geração do projeto:", error.message);
    throw new Error(`Erro durante a geração do projeto: ${error.message}`);
  }
}
