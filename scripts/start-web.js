const { spawn, exec } = require("child_process");

const start = async () => {
  try {
    const expoProcess = spawn(
      "npx",
      ["expo", "start", "--web", "--localhost"],
      {
        shell: true,
        stdio: "inherit",
      },
    );

    expoProcess.on("close", (code) => {
      process.exit(code ?? 0);
    });

    expoProcess.on("error", (error) => {
      console.error("[web] Falha ao iniciar o Expo:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("[web] Erro ao preparar inicializacao web:", error.message);
    process.exit(1);
  }
};

start();
