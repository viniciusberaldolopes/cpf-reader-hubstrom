# Extrator de CPF — Hubstrom

Aplicação em Vue 2.7 (Options API) que extrai CPFs de arquivos PDF, valida os dígitos verificadores e armazena os resultados no Firebase.

## Tecnologias

- Vue 2.7 e Vite
- PDF.js
- Firebase Realtime Database
- Firebase Storage
- SCSS

## Como executar

### Pré-requisitos

- Node.js 20.19 ou superior
- npm
- Um projeto criado no Firebase

### Instalação

```bash
git clone URL_DO_REPOSITORIO
cd cpf-reader-hubstrom
npm install
cp .env.example .env
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`.

## Variáveis de ambiente

No Firebase Console, abra **Configurações do projeto > Seus aplicativos** e cadastre uma aplicação Web. Copie os valores do objeto `firebaseConfig` para o arquivo `.env`:

| Variável | Origem no Firebase |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

O arquivo `.env` é ignorado pelo Git. O `.env.example` contém somente os nomes das variáveis e pode ser versionado com segurança.

## Firebase

1. Abra **Build > Realtime Database** e crie uma instância.
2. Abra **Build > Storage** e crie o bucket.
3. Confirme que `VITE_FIREBASE_DATABASE_URL` possui a URL completa da instância.
4. Publique o conteúdo de `database.rules.json` nas regras do Realtime Database.
5. Publique o conteúdo de `storage.rules` nas regras do Storage.

As regras incluídas permitem acesso público para facilitar a avaliação sem autenticação. Elas não são recomendadas para produção.

### Estrutura dos dados

```text
uploads/{uploadId}
  fileName
  fileSize
  storagePath
  downloadUrl
  uploadedAt
  validCount
  invalidCount

cpfRecords/{recordId}
  formatted
  normalized
  fileName
  uploadId
  extractedAt
```

## Regras de negócio

- Apenas arquivos PDF de até 10 MB são aceitos.
- Apenas CPFs no formato `XXX.XXX.XXX-XX` são localizados.
- Sequências repetidas e dígitos verificadores incorretos são inválidos.
- CPFs repetidos dentro do mesmo documento são removidos.
- Somente CPFs válidos são salvos no Realtime Database.
- PDFs escaneados sem camada de texto exigiriam OCR, que não faz parte deste projeto.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run build`: gera a versão de produção em `dist/`.
- `npm run preview`: executa localmente o build de produção.

## Organização

- `src/components`: componentes visuais reutilizáveis.
- `src/services/cpf.service.js`: extração e validação matemática dos CPFs.
- `src/services/pdf.service.js`: leitura das páginas do PDF.
- `src/services/database.service.js`: leitura e escrita no Realtime Database.
- `src/services/storage.service.js`: upload e remoção compensatória no Storage.
- `src/services/firebase.js`: inicialização do SDK via variáveis de ambiente.

## Build de produção

```bash
npm run build
```

O conteúdo pronto para hospedagem será criado na pasta `dist/`.
