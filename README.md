# Notes

App de **Bloco de Notas** em Bootstrap 5 + JS puro, publicado via GitHub Pages
e usando a API [windlog](https://api.windlog.org/docs) como backend.

- Código do app: [`notes-app/`](./notes-app)
- Workflow de deploy: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

## Deploy automático

A cada `push` na `main`, o GitHub Actions:

1. Injeta o secret `API_KEY` em `notes-app/assets/js/env.js`.
2. Publica a pasta `notes-app/` no GitHub Pages.

### Configuração única

1. No repositório, em **Settings → Pages**, selecione **GitHub Actions** como source.
2. Em **Settings → Secrets and variables → Actions**, confirme o secret `API_KEY`.

## Desenvolvimento local

```bash
cd notes-app
cp assets/js/env.example.js assets/js/env.js   # coloque sua chave aí
python3 -m http.server 8080
# abra http://localhost:8080
```

`env.js` está no `.gitignore` — nunca é commitado.

Veja [`notes-app/README.md`](./notes-app/README.md) para arquitetura e detalhes.
