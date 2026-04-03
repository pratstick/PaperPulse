"""Pluggable LLM summarization service.

Set LLM_PROVIDER=openai | anthropic | mock in .env.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Protocol

from app.config import get_settings

logger = logging.getLogger(__name__)

SUMMARY_PROMPT_TEMPLATE = """\
You are a research assistant. Given the title and abstract of an academic paper, produce a structured summary in JSON.

Title: {title}
Abstract: {abstract}

Respond ONLY with valid JSON in this exact format:
{{
  "summary": "3-5 sentence summary of the paper",
  "key_contributions": ["contribution 1", "contribution 2", "contribution 3"],
  "practical_relevance": "1-2 sentences on real-world applications",
  "limitations": "1-2 sentences on limitations or caveats, or null if none are mentioned",
  "why_it_matters": "1 sentence explanation of significance",
  "importance_score": <integer 0-100 based on novelty, impact, and clarity>
}}"""


class LLMProvider(Protocol):
    async def summarize(self, title: str, abstract: str) -> dict:
        ...


class MockProvider:
    """Returns deterministic fake summaries — no API key needed."""

    async def summarize(self, title: str, abstract: str) -> dict:
        words = title.lower().split()
        score = min(100, max(30, len(words) * 5 + len(abstract) // 20))
        return {
            "summary": (
                f"This paper presents research on {title[:60]}. "
                "The authors investigate novel approaches in this domain. "
                "Experiments demonstrate significant improvements over baselines. "
                "The work contributes to our understanding of the field."
            ),
            "key_contributions": [
                "Novel methodology for the problem",
                "Extensive experimental evaluation",
                "State-of-the-art results on standard benchmarks",
            ],
            "practical_relevance": (
                "This work has direct applications in industry and research settings. "
                "Practitioners can adopt the proposed method with minimal overhead."
            ),
            "limitations": (
                "The evaluation is limited to specific benchmarks. "
                "Scalability to larger datasets remains to be explored."
            ),
            "why_it_matters": "Advances the state of the art and opens new research directions.",
            "importance_score": score,
        }


class OpenAIProvider:
    def __init__(self):
        from openai import AsyncOpenAI
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def summarize(self, title: str, abstract: str) -> dict:
        prompt = SUMMARY_PROMPT_TEMPLATE.format(title=title, abstract=abstract[:3000])
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
        )
        return _parse_json(response.choices[0].message.content)


class AnthropicProvider:
    def __init__(self):
        import anthropic
        settings = get_settings()
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def summarize(self, title: str, abstract: str) -> dict:
        prompt = SUMMARY_PROMPT_TEMPLATE.format(title=title, abstract=abstract[:3000])
        message = await self.client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        return _parse_json(message.content[0].text)


def _parse_json(text: str) -> dict:
    # strip markdown fences if present
    text = re.sub(r"```(?:json)?\n?", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM JSON response, using fallback")
        return {
            "summary": text[:500],
            "key_contributions": [],
            "practical_relevance": None,
            "limitations": None,
            "why_it_matters": None,
            "importance_score": 50,
        }


def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    provider = settings.llm_provider.lower()
    if provider == "openai":
        return OpenAIProvider()
    if provider == "anthropic":
        return AnthropicProvider()
    return MockProvider()
