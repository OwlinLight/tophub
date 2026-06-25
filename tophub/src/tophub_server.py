from datetime import date, timedelta
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

HUB_API_BASE = "https://api.github.com"
USER_AGENT = "tophub-app/1.0"
DEFAULT_REPO_LIMIT = 5


async def make_hub_request(
    url: str, params: dict[str, Any] | None = None
) -> dict[str, Any] | None:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError:
            return None


def format_repo_summary(data: dict[str, Any], limit: int = 20) -> str:
    repos = data.get("items", [])

    if not repos:
        return "No repositories found."

    summaries = []
    for i, repo in enumerate(repos[:limit], start=1):
        name = repo.get("full_name", "N/A")
        description = repo.get("description") or "No description"
        stars = repo.get("stargazers_count", 0)
        forks = repo.get("forks_count", 0)
        language = repo.get("language") or "Unknown"
        url = repo.get("html_url", "N/A")
        created_at = repo.get("created_at", "N/A")
        updated_at = repo.get("updated_at", "N/A")

        summaries.append(
            f"""{i}. {name}
   Description: {description}
   Language: {language}
   Stars: {stars:,} | Forks: {forks:,}
   Created: {created_at}
   Updated: {updated_at}
   URL: {url}"""
        )

    return "\n\n".join(summaries)


async def get_tops_summary(days: int, limit: int = DEFAULT_REPO_LIMIT) -> str:
    if days < 1:
        return "Days must be at least 1."

    url = f"{HUB_API_BASE}/search/repositories"
    since = (date.today() - timedelta(days=days)).isoformat()
    params = {
        "q": f"created:>={since} is:public",
        "sort": "stars",
        "order": "desc",
        "per_page": limit,
    }
    data = await make_hub_request(url, params=params)

    if not data:
        return "Unable to fetch GitHub repository data."

    return format_repo_summary(data, limit=limit)


def create_mcp_server() -> FastMCP:
    mcp = FastMCP("tophub")

    @mcp.tool()
    async def get_tops(days: int) -> str:
        """Get top starred public GitHub repositories created in the last N days."""
        return await get_tops_summary(days)

    return mcp
