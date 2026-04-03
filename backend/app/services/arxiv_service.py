"""arXiv paper ingestion service."""
from __future__ import annotations

import hashlib
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

ARXIV_API = "https://export.arxiv.org/api/query"
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "arxiv": "http://arxiv.org/schemas/atom",
}


def _text(el: Any, tag: str, ns: str = "atom") -> str:
    child = el.find(f"{ns}:{tag}", NS)
    return child.text.strip() if child is not None and child.text else ""


def _parse_date(s: str) -> datetime:
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            dt = datetime.strptime(s, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    return datetime.now(timezone.utc)


def build_query(arxiv_category: str | None, arxiv_query: str | None) -> str:
    parts = []
    if arxiv_category:
        parts.append(f"cat:{arxiv_category}")
    if arxiv_query:
        parts.append(f"all:{arxiv_query}")
    return " AND ".join(parts) if parts else "all:machine+learning"


async def fetch_papers(
    arxiv_category: str | None,
    arxiv_query: str | None,
    max_results: int = 25,
) -> list[dict]:
    query = build_query(arxiv_category, arxiv_query)
    params = {
        "search_query": query,
        "start": 0,
        "max_results": max_results,
        "sortBy": "submittedDate",
        "sortOrder": "descending",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(ARXIV_API, params=params)
        resp.raise_for_status()

    root = ET.fromstring(resp.text)
    papers = []
    for entry in root.findall("atom:entry", NS):
        arxiv_id_raw = _text(entry, "id")
        # normalize to short ID like 2401.12345
        arxiv_id = arxiv_id_raw.replace("http://arxiv.org/abs/", "").strip()
        title = _text(entry, "title").replace("\n", " ").strip()
        abstract = _text(entry, "summary").replace("\n", " ").strip()
        published = _parse_date(_text(entry, "published"))
        updated = _parse_date(_text(entry, "updated"))
        authors = [
            a.find("atom:name", NS).text.strip()
            for a in entry.findall("atom:author", NS)
            if a.find("atom:name", NS) is not None
        ]
        arxiv_url = arxiv_id_raw if arxiv_id_raw.startswith("http") else f"https://arxiv.org/abs/{arxiv_id}"
        pdf_url = f"https://arxiv.org/pdf/{arxiv_id}"

        papers.append(
            {
                "arxiv_id": arxiv_id,
                "title": title,
                "authors": authors,
                "abstract": abstract,
                "published_at": published,
                "updated_at": updated,
                "arxiv_url": arxiv_url,
                "pdf_url": pdf_url,
            }
        )
    return papers
