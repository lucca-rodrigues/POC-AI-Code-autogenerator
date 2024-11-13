import { Tool } from "@langchain/core/tools";
import axios from "axios";
import * as cheerio from "cheerio";

export class WebScrapingTool extends Tool {
  constructor() {
    super();
  }

  name = "web_scraper";
  description = "Obtém informações de páginas web para enriquecer o contexto";

  async _call(input) {
    try {
      const url = input;
      console.log(`🌐 Acessando URL: ${url}`);

      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Remove scripts, styles e tags desnecessárias
      $("script").remove();
      $("style").remove();
      $("head").remove();

      // Extrai o texto principal
      const text = $("body").text().replace(/\s+/g, " ").trim();

      console.log(`✅ Conteúdo extraído de ${url}`);
      return text;
    } catch (error) {
      console.error(`❌ Erro ao acessar ${input}:`, error.message);
      throw new Error(`Falha ao acessar a URL: ${error.message}`);
    }
  }
}
