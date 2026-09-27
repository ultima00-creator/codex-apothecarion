# Codex:Apothecarion

Diarium de fármacos e ala Gene-Seed. A tomada fica no navegador. A curva é fração da própria dose ou a duração citada na ficha. Não é prescrição e não mistura unidades diferentes no mesmo eixo.

## Onde o projeto fica

O `package.json` fica na raiz do repositório, junto de `src/`, `public/`, `scripts/`, `server/` e `migrations/`. Não há subpasta de app. Se a Vercel apontar o Root Directory para outra pasta, o build não acha o projeto.

## Deploy a partir da branch

A branch de produção é `main`. Cada push nela dispara o deploy, desde que o projeto da Vercel esteja ligado a este repositório.

| Campo na Vercel | Valor |
| --- | --- |
| Framework Preset | Other |
| Root Directory | `./` |
| Production Branch | `main` |
| Node.js Version | 22.x |
| Install Command | o `vercel.json` já define |
| Build Command | `npm run build` |
| Output Directory | vazio |

O build gera `.vercel/output`. Não aponte a saída para `dist`. O preset Other evita que a Vercel trate o projeto como um Vite estático e ignore esse resultado.

Não defina `DATABASE_URL` neste teste. Sem ela, a migração é pulada e o Diarium continua no navegador. Não ligue autenticação sem um banco.
