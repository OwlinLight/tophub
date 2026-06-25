# tophub

Tophub is a remote MCP server that exposes GitHub's fastest-growing public
repositories for a recent time window.

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

The deployable Cloudflare surface is a Python Worker MCP server in
`src/worker.py`. It runs the FastMCP app behind a Durable Object and exposes the
server over MCP's SSE transport.

Remote MCP endpoint:

- `/sse`

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

This follows Cloudflare's Python Workers MCP pattern, so deployment may require
a Workers Paid plan if the packaged Python Worker exceeds the free size limit.
