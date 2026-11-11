# Bloco de Notas

App simples, bonito e responsivo em **Bootstrap 5** + **JavaScript puro**,
usando a API [windlog](https://api.windlog.org/docs) como back-end.

## Funcionalidades

- Cadastro e login (senha nunca armazenada em texto puro — SHA-256).
- Sessão persistente via `localStorage`.
- CRUD completo de notas (criar, ler, editar, excluir).
- Busca em título e conteúdo.
- Fixar notas no topo.
- Totalmente responsivo (mobile → desktop).
- Toasts de feedback para cada ação.

## Como rodar

Como é 100% estático, basta abrir `index.html` num navegador moderno.

Para desenvolvimento, use qualquer servidor estático, por exemplo:

```bash
cd notes-app
python3 -m http.server 8080
# depois abra http://localhost:8080
```

## Estrutura

```
notes-app/
├── index.html                 # Shell principal (navbar + container)
├── README.md
└── assets/
    ├── css/
    │   └── style.css          # Estilos próprios (além do Bootstrap)
    └── js/
        ├── config.js          # Constantes (API, coleções, storage)
        ├── utils.js           # Helpers (hash, datas, toast, escape)
        ├── api.js             # Cliente HTTP da API windlog
        ├── auth.js            # Autenticação (registro/login/sessão)
        ├── notes.js           # CRUD de notas (regras de domínio)
        ├── ui.js              # Renderização das telas / modal
        ├── router.js          # Roteador por hash (#/login, #/notes…)
        └── app.js             # Bootstrap da aplicação
```

### Organização por responsabilidade

- **config.js / utils.js** — base, sem dependências.
- **api.js** — só conhece HTTP e o envelope `{ok,data,error}` da API.
- **auth.js / notes.js** — regras de domínio (contas, notas), usam `api.js`.
- **ui.js** — camada de apresentação, usa `auth.js` e `notes.js`.
- **router.js / app.js** — amarrações e inicialização.

## Como a autenticação funciona

A API windlog é um banco de dados genérico, sem sistema de contas nativo.
A autenticação é implementada assim:

- Cada conta é um documento em `notes_app_users`
  (`{ email, name, passwordHash, createdAt }`).
- O login compara o hash SHA-256 da senha digitada com o armazenado.
- A sessão (id, email, nome) é persistida em `localStorage`.
- Cada nota guarda `userId` e é filtrada no cliente.

### Limitações conhecidas

- **A API-Key fica no frontend.** Qualquer visitante pode lê-la
  e, com ela, acessar todos os dados. Para produção, coloque a API
  por trás de um backend próprio que só exponha operações autenticadas.
- Sem recuperação de senha automática.
- A busca é client-side; para grandes volumes considere outra estratégia.
