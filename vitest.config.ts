import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    setupFiles: ["tests/setup-env.ts"],
    // Testes e2e compartilham um único banco de teste real (research.md, Decisão 4);
    // rodar arquivos de teste em paralelo causaria truncamentos concorrentes entre si.
    fileParallelism: false,
  },
});
