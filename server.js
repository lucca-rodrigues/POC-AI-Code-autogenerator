import express from "express";
import dotenv from "dotenv";
import { generateProject } from "./index.js";

dotenv.config();

const app = express();
app.use(express.json());

// Rota para receber o prompt
app.post("/generate", async (req, res) => {
  try {
    console.log("\n📨 Nova requisição recebida");
    const { prompt } = req.body;

    if (!prompt) {
      console.log("❌ Erro: Prompt não fornecido");
      return res.status(400).json({ error: "O prompt é obrigatório" });
    }

    console.log("🎯 Iniciando geração com prompt:", prompt);
    const result = await generateProject(prompt);
    console.log("✅ Geração concluída com sucesso");
    res.json(result);
  } catch (error) {
    console.error("❌ Erro no servidor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Rota de healthcheck
app.get("/health", (req, res) => {
  console.log("💓 Healthcheck realizado");
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
});
