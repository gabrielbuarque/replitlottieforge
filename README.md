# LottieForge

**LottieForge** é um editor online de animações Lottie. Permite importar animações do LottieFiles ou arquivos `.json`, editar cores, visualizar e exportar em múltiplos formatos. 100 % construído em TypeScript.

---

## 🛠️  Stack

| Camada        | Tecnologias                                   |
| ------------- | ---------------------------------------------- |
| Front-end     | React + Vite + Tailwind CSS + Radix UI         |
| Back-end      | Node.js (Express) + TSX (hot-reload TypeScript) |
| Banco opcional| Drizzle ORM + PostgreSQL (Neon)                |
| Build Tooling | esbuild, concurrently, autoprefixer            |

---

## 📂  Estrutura

```
replitlottieforge/
├── client/          # App React/Vite
├── server/          # API Express
├── shared/          # Schemas / código comum
├── dist/            # Build de produção (gerado)
└── ...
```

---

## 🚀  Executando em modo **desenvolvimento**

Pré-requisitos: **Node 20+** e **npm**.

```bash
# 1. Instale dependências (apenas na primeira vez)
npm install

# 2. Rode client + server simultaneamente
npm run dev
```

| Serviço    | URL                    | Descrição                               |
| ---------- | ---------------------- | --------------------------------------- |
| Vite (UI)  | http://localhost:3000  | Hot-reload do React + Tailwind          |
| API        | http://localhost:5000  | Rotas **/api**  (Express + TSX)         |

O Vite já possui um **proxy** que redireciona as chamadas `/api` da UI para `localhost:5000`, evitando problemas de CORS.

Scripts úteis:

```bash
npm run dev:client   # somente o front-end
npm run dev:server   # somente o back-end (hot-reload)
```

---

## 🏭  Build & deploy **produção**

1. **Gerar build** (front-end otimizado + bundle do servidor):
   ```bash
   npm run build
   ```
   - Cria `dist/public` (estático) e `dist/index.js`.

2. **Executar** (um único processo):
   ```bash
   # variáveis opcionais
   #   PORT – porta que o servidor Express irá usar (padrão 5000)
   #   NODE_ENV – mantenha "production"
   
   NODE_ENV=production PORT=8080 npm start
   ```

3. **Serviço** – Use PM2, Docker ou Systemd para manter o processo vivo em produção.

---

## 🔧  Variáveis de ambiente (opcional)

| Nome     | Padrão   | Descrição                         |
| -------- | -------- | --------------------------------- |
| PORT     | `5000`   | Porta do servidor Express         |
| NODE_ENV | `development` | Define ambiente (`production`) |

Crie um arquivo `.env` (git-ignored) se desejar ajustar variáveis.

---

## 📜  Licença

MIT © 2025 LottieForge 

## 🧹  Resetando dependências / limpando cache

Caso encontre problemas de build em outra máquina ou queira garantir instalação limpa:

```bash
npm run clean   # remove node_modules, package-lock.json, cache do npm e pré-bundles do Vite
npm install     # reinstala tudo do zero
```

O script utiliza `rimraf` (já incluso em *devDependencies*) para funcionar em todos os sistemas operacionais.

--- 