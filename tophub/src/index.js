const HUB_API_BASE = "https://api.github.com";
const USER_AGENT = "tophub-app/1.0";
const DEFAULT_LIMIT = 5;
const MAX_DAYS = 3650;
const MAX_LIMIT = 20;

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...headers
    }
  });
}

function textResponse(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "access-control-allow-origin": "*",
      ...headers
    }
  });
}

function parseIntegerParam(searchParams, name, fallback, { min, max }) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue === "") {
    return fallback;
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${name} must be a whole number.`);
  }

  const value = Number(rawValue);
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }

  return value;
}

function isoDateDaysAgo(days, now = new Date()) {
  const millisPerDay = 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - days * millisPerDay).toISOString().slice(0, 10);
}

function normalizeRepo(repo) {
  return {
    full_name: repo.full_name ?? "N/A",
    description: repo.description ?? "No description",
    language: repo.language ?? "Unknown",
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    created_at: repo.created_at ?? "N/A",
    updated_at: repo.updated_at ?? "N/A",
    url: repo.html_url ?? "N/A"
  };
}

function formatRepoSummary(repos) {
  if (repos.length === 0) {
    return "No repositories found.";
  }

  return repos.map((repo, index) => `${index + 1}. ${repo.full_name}
   Description: ${repo.description}
   Language: ${repo.language}
   Stars: ${repo.stars.toLocaleString("en-US")} | Forks: ${repo.forks.toLocaleString("en-US")}
   Created: ${repo.created_at}
   Updated: ${repo.updated_at}
   URL: ${repo.url}`).join("\n\n");
}

async function fetchTopRepos({ days, limit, fetcher = fetch }) {
  const since = isoDateDaysAgo(days);
  const url = new URL("/search/repositories", HUB_API_BASE);
  url.searchParams.set("q", `created:>=${since} is:public`);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(limit));

  const response = await fetcher(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "application/vnd.github+json",
      "x-github-api-version": "2022-11-28"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API returned ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  return (data.items ?? []).slice(0, limit).map(normalizeRepo);
}

async function handleTops(request) {
  const url = new URL(request.url);
  const days = parseIntegerParam(url.searchParams, "days", 7, {
    min: 1,
    max: MAX_DAYS
  });
  const limit = parseIntegerParam(url.searchParams, "limit", DEFAULT_LIMIT, {
    min: 1,
    max: MAX_LIMIT
  });
  const repos = await fetchTopRepos({ days, limit });

  if (url.searchParams.get("format") === "text" || request.headers.get("accept")?.includes("text/plain")) {
    return textResponse(formatRepoSummary(repos));
  }

  return jsonResponse({
    query: {
      days,
      limit
    },
    repositories: repos
  });
}

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "content-type"
      }
    });
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405, { allow: "GET, OPTIONS" });
  }

  try {
    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok" });
    }

    if (url.pathname === "/tops") {
      return await handleTops(request);
    }

    if (url.pathname === "/") {
      return jsonResponse({
        name: "tophub",
        endpoints: {
          health: "/health",
          tops: "/tops?days=7&limit=5"
        }
      });
    }

    return jsonResponse({ error: "Not found." }, 404);
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}

export {
  fetchTopRepos,
  formatRepoSummary,
  handleRequest,
  isoDateDaysAgo,
  parseIntegerParam
};

export default {
  fetch: handleRequest
};
