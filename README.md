# Extrator de CPF e CNPJ — Hubstrom

Aplicação em Vue 2.7 (Options API) que extrai CPFs e CNPJs de arquivos PDF, valida os dígitos verificadores e armazena os resultados no Firebase Realtime Database. Os PDFs são enviados ao Supabase Storage.

## Tecnologias

- Vue 2.7 e Vite
- PDF.js
- Tesseract.js para OCR de PDFs sem camada de texto útil
- Firebase Realtime Database
- Supabase Storage
- SCSS
- Tema claro/escuro com variáveis CSS e preferência persistida no navegador

## Como executar

### Pré-requisitos

- Node.js 20.19 ou superior
- npm
- Um projeto no Firebase com o Realtime Database configurado
- Um projeto gratuito criado no Supabase

### Instalação

```bash
git clone https://github.com/viniciusberaldolopes/cpf-reader-hubstrom.git
cd cpf-reader-hubstrom
npm install
cp .env.example .env
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`.

## Variáveis de ambiente

Copie a configuração da aplicação Web do Firebase e os valores públicos da API do Supabase para o arquivo `.env`:

| Variável                        | Origem                                 |
| ------------------------------- | -------------------------------------- |
| `VITE_FIREBASE_API_KEY`         | Firebase `apiKey`                      |
| `VITE_FIREBASE_AUTH_DOMAIN`     | Firebase `authDomain`                  |
| `VITE_FIREBASE_DATABASE_URL`    | URL do Realtime Database               |
| `VITE_FIREBASE_PROJECT_ID`      | Firebase `projectId`                   |
| `VITE_FIREBASE_APP_ID`          | Firebase `appId`                       |
| `VITE_SUPABASE_URL`             | Supabase Project URL                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key ou `anon` key |

O arquivo `.env` é ignorado pelo Git. O `.env.example` contém somente os nomes das variáveis e pode ser versionado com segurança.

## Configuração dos serviços

1. No Firebase, crie o Realtime Database e publique `database.rules.json` na aba **Regras**.
2. No Supabase, aplique a migration com `npx supabase db push` para criar o bucket.
3. Preencha no `.env` as configurações dos dois serviços.
4. Reinicie `npm run dev` depois de alterar o `.env`.

As regras permitem acesso anônimo para facilitar a avaliação sem autenticação; não são recomendadas para produção com documentos reais.

> O enunciado original especifica Firebase Storage. Como a ativação do serviço
> passou a exigir uma conta com faturamento, os PDFs são armazenados no Supabase
> Storage. O Firebase Realtime Database continua responsável pelos dados da aplicação.

### Estrutura dos dados

```text
uploads/{uploadId}
  fileName, fileSize, storagePath, downloadUrl
  uploadedAt, validCount, invalidCount
  documents

cpfRecords/{recordId}
  type, formatted, normalized, fileName, uploadId, extractedAt
```

## Regras de negócio

- Apenas arquivos PDF de até 10 MB são aceitos.
- Apenas CPFs no formato `XXX.XXX.XXX-XX` são localizados.
- CNPJs numéricos e alfanuméricos no formato `XX.XXX.XXX/XXXX-XX` são localizados.
- Sequências repetidas e dígitos verificadores incorretos são inválidos.
- Documentos repetidos dentro do mesmo PDF são removidos.
- Somente CPFs e CNPJs válidos são salvos no banco de dados.
- PDFs digitalizados ou com os dados incorporados como imagem usam OCR como fallback.

## Tema da interface

Na primeira visita, a aplicação respeita `prefers-color-scheme`, a preferência de tema configurada no sistema operacional. Depois que o usuário alterna o tema pelo menu lateral, a escolha é salva no `localStorage`. O atributo `data-theme` aplicado ao elemento `html` seleciona as variáveis CSS do tema claro ou escuro.

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
- `src/services/cpf.service.js`: extração e validação matemática de CPF e CNPJ.
- `src/services/pdf.service.js`: leitura das páginas do PDF.
- `src/services/theme.service.js`: preferência, persistência e alternância do tema.
- `src/services/database.service.js`: leitura e escrita no Realtime Database.
- `src/services/storage.service.js`: upload e remoção compensatória no Supabase Storage.
- `src/services/firebase.js`: inicialização do Firebase para o banco.
- `src/services/supabase.js`: inicialização do Supabase para arquivos.

## Build de produção

```bash
npm run build
```

O conteúdo pronto para hospedagem será criado na pasta `dist/`.
