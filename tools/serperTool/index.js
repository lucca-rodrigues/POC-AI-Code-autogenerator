import { Tool } from "@langchain/core/tools";
import axios from "axios";

export class SerperTool extends Tool {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  name = "serper_search";
  description = "Realiza buscas na web usando Serper API";

  async _call(input) {
    try {
      console.log(`🔍 Realizando busca: "${input}"`);

      const response = await axios.post(
        "https://google.serper.dev/search",
        {
          q: input,
          num: 5, // Número de resultados
        },
        {
          headers: {
            "X-API-KEY": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      // Formata os resultados
      const results = response.data.organic.map((result) => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link,
      }));

      // Combina os resultados em um texto
      const formattedResults = results
        .map(
          (r) => `
          Título: ${r.title}
          Resumo: ${r.snippet}
          Link: ${r.link}
        `
        )
        .join("\n---\n");

      console.log(`✅ Busca concluída: ${results.length} resultados encontrados`);
      return formattedResults;
    } catch (error) {
      console.error(`❌ Erro na busca: ${error.message}`);
      throw new Error(`Falha na busca: ${error.message}`);
    }
  }
}
