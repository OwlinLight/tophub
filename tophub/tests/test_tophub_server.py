import pytest

from tophub_server import format_repo_summary, get_tops_summary


def test_format_repo_summary_empty():
    assert format_repo_summary({"items": []}) == "No repositories found."


def test_format_repo_summary_formats_repositories():
    summary = format_repo_summary(
        {
            "items": [
                {
                    "full_name": "owner/repo",
                    "description": None,
                    "stargazers_count": 1234,
                    "forks_count": 56,
                    "language": None,
                    "html_url": "https://github.com/owner/repo",
                    "created_at": "2026-06-01T00:00:00Z",
                    "updated_at": "2026-06-02T00:00:00Z",
                }
            ]
        },
        limit=1,
    )

    assert "1. owner/repo" in summary
    assert "Description: No description" in summary
    assert "Language: Unknown" in summary
    assert "Stars: 1,234 | Forks: 56" in summary


@pytest.mark.asyncio
async def test_get_tops_summary_rejects_invalid_days():
    assert await get_tops_summary(0) == "Days must be at least 1."
