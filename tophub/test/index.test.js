import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  fetchTopRepos,
  formatRepoSummary,
  handleRequest,
  isoDateDaysAgo,
  parseIntegerParam
} from "../src/index.js";

describe("Cloudflare Worker helpers", () => {
  it("computes the GitHub created date from the days window", () => {
    assert.equal(isoDateDaysAgo(7, new Date("2026-06-25T12:00:00Z")), "2026-06-18");
  });

  it("validates integer query params", () => {
    assert.equal(parseIntegerParam(new URLSearchParams("days=30"), "days", 7, { min: 1, max: 3650 }), 30);
    assert.throws(
      () => parseIntegerParam(new URLSearchParams("days=0"), "days", 7, { min: 1, max: 3650 }),
      /between 1 and 3650/
    );
    assert.throws(
      () => parseIntegerParam(new URLSearchParams("days=1.5"), "days", 7, { min: 1, max: 3650 }),
      /whole number/
    );
  });

  it("formats repository summaries like the Python MCP server", () => {
    assert.equal(formatRepoSummary([]), "No repositories found.");
    assert.match(
      formatRepoSummary([
        {
          full_name: "owner/repo",
          description: "A test repo",
          language: "JavaScript",
          stars: 1234,
          forks: 56,
          created_at: "2026-06-01T00:00:00Z",
          updated_at: "2026-06-02T00:00:00Z",
          url: "https://github.com/owner/repo"
        }
      ]),
      /Stars: 1,234 \| Forks: 56/
    );
  });

  it("normalizes GitHub search results", async () => {
    const repos = await fetchTopRepos({
      days: 7,
      limit: 1,
      fetcher: async (url) => {
        assert.equal(url.searchParams.get("sort"), "stars");
        assert.equal(url.searchParams.get("per_page"), "1");
        return new Response(JSON.stringify({
          items: [
            {
              full_name: "owner/repo",
              description: null,
              language: null,
              stargazers_count: 10,
              forks_count: 2,
              created_at: "2026-06-01T00:00:00Z",
              updated_at: "2026-06-02T00:00:00Z",
              html_url: "https://github.com/owner/repo"
            }
          ]
        }));
      }
    });

    assert.deepEqual(repos, [
      {
        full_name: "owner/repo",
        description: "No description",
        language: "Unknown",
        stars: 10,
        forks: 2,
        created_at: "2026-06-01T00:00:00Z",
        updated_at: "2026-06-02T00:00:00Z",
        url: "https://github.com/owner/repo"
      }
    ]);
  });

  it("returns root metadata", async () => {
    const response = await handleRequest(new Request("https://example.com/"));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).name, "tophub");
  });
});
