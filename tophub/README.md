# tophub

Tophub exposes GitHub's fastest-growing public repositories for a recent time
window.

## Local MCP server

Run the stdio MCP server:

```sh
uv run python tophub.py
```

Run the sample MCP client:

```sh
uv run python client.py --demo
```

## Cloudflare Worker

The deployable Cloudflare surface is an HTTP Worker in `src/index.js`.

Endpoints:

- `GET /health`
- `GET /tops?days=7&limit=5`
- `GET /tops?days=7&limit=5&format=text`

Validate locally:

```sh
npm test
```

Preview with Wrangler:

```sh
npm run dev
```

Deploy to Cloudflare:

```sh
npm run deploy
```

Wrangler must be authenticated before deployment:

```sh
npx wrangler login
```
