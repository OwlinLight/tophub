from workers import DurableObject

from tophub_server import create_mcp_server


def create_asgi_app():
    from starlette.middleware.cors import CORSMiddleware

    mcp = create_mcp_server()
    app = mcp.sse_app()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app


class TopHubMCPServer(DurableObject):
    def __init__(self, ctx, env):
        self.ctx = ctx
        self.env = env
        self.app = create_asgi_app()

    async def on_fetch(self, request, env, ctx):
        import asgi

        return await asgi.fetch(self.app, request, self.env, self.ctx)


async def on_fetch(request, env):
    durable_id = env.TOPHUB_MCP.idFromName("tophub")
    durable_object = env.TOPHUB_MCP.get(durable_id)
    return await durable_object.fetch(request)
