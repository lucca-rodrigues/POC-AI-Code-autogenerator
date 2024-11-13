import { Tool } from "@langchain/core/tools";
import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);

export class DependencyInstallerTool extends Tool {
  constructor() {
    super();
  }

  name = "dependency_installer";
  description = "Instala as dependências do projeto";

  async checkNodeVersion() {
    try {
      const { stdout } = await execAsync("node --version");
      const version = parseInt(stdout.slice(1).split(".")[0]);

      if (version < 21) {
        console.log("⚠️ Versão do Node.js inferior a 21 detectada");
        console.log("🔄 Tentando mudar para Node.js 21 usando NVM...");

        try {
          // Verifica se o NVM está instalado
          await execAsync("nvm --version");

          // Instala Node 21 se necessário e muda para ele
          await execAsync("nvm install 21 || true");
          await execAsync("nvm use 21");

          // Verifica a nova versão
          const { stdout: newVersion } = await execAsync("node --version");
          console.log(`✅ Agora usando Node.js ${newVersion.trim()}`);
        } catch (nvmError) {
          throw new Error("NVM não está instalado. Por favor, instale o NVM e o Node.js 21+");
        }
      } else {
        console.log(`✅ Usando Node.js versão ${stdout.trim()}`);
      }
    } catch (error) {
      throw new Error(`Erro ao verificar versão do Node.js: ${error.message}`);
    }
  }

  async verifyResultFolder(resultPath) {
    try {
      if (!(await fs.exists(resultPath))) {
        throw new Error("Pasta 'result' não encontrada");
      }

      // Verifica se tem permissão de escrita
      try {
        await fs.access(resultPath, fs.constants.W_OK);
      } catch (error) {
        throw new Error("Sem permissão de escrita na pasta 'result'");
      }

      console.log("✅ Pasta 'result' verificada com sucesso");
    } catch (error) {
      throw new Error(`Erro ao verificar pasta 'result': ${error.message}`);
    }
  }

  async _call(input) {
    try {
      const { resultPath, dependencies } = JSON.parse(input);
      console.log("📦 Iniciando instalação de dependências...");

      // Verifica requisitos
      await this.checkNodeVersion();
      await this.verifyResultFolder(resultPath);

      // Verifica se existe package.json
      const packageJsonPath = path.join(resultPath, "package.json");
      if (!(await fs.exists(packageJsonPath))) {
        console.log("📝 Inicializando package.json...");
        await execAsync("npm init -y", { cwd: resultPath });
      }

      // Lê o package.json existente
      const packageJson = await fs.readJson(packageJsonPath);

      // Adiciona type: module se não existir
      if (!packageJson.type) {
        packageJson.type = "module";
      }

      // Prepara os comandos de instalação
      const runtimeDeps = Object.keys(dependencies.runtime || {});
      const devDeps = Object.keys(dependencies.dev || {});

      if (runtimeDeps.length > 0) {
        console.log("📦 Instalando dependências de produção...");
        const installCmd = `npm install ${runtimeDeps.join(" ")} --save`;
        const { stdout, stderr } = await execAsync(installCmd, { cwd: resultPath });
        console.log(stdout);
        if (stderr) console.error(stderr);
      }

      if (devDeps.length > 0) {
        console.log("🛠️ Instalando dependências de desenvolvimento...");
        const installDevCmd = `npm install ${devDeps.join(" ")} --save-dev`;
        const { stdout, stderr } = await execAsync(installDevCmd, { cwd: resultPath });
        console.log(stdout);
        if (stderr) console.error(stderr);
      }

      // Atualiza o package.json com scripts padrão se não existirem
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      if (!packageJson.scripts.start) {
        packageJson.scripts.start = "node dist/index.js";
      }

      if (!packageJson.scripts.dev) {
        packageJson.scripts.dev = "ts-node-dev --respawn --transpile-only src/index.ts";
      }

      if (!packageJson.scripts.build) {
        packageJson.scripts.build = "tsc";
      }

      // Salva o package.json atualizado
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      return "Dependências instaladas com sucesso!";
    } catch (error) {
      console.error("❌ Erro ao instalar dependências:", error);
      throw new Error(`Falha ao instalar dependências: ${error.message}`);
    }
  }
}
