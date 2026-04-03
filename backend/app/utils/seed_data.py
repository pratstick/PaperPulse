"""Seed default topics and demo data."""
from __future__ import annotations

DEFAULT_TOPICS = [
    {
        "name": "llms",
        "display_name": "Large Language Models",
        "arxiv_category": "cs.CL",
        "arxiv_query": "large language models",
        "is_default": True,
        "icon": "🤖",
    },
    {
        "name": "ml",
        "display_name": "Machine Learning",
        "arxiv_category": "cs.LG",
        "arxiv_query": None,
        "is_default": True,
        "icon": "📈",
    },
    {
        "name": "cv",
        "display_name": "Computer Vision",
        "arxiv_category": "cs.CV",
        "arxiv_query": None,
        "is_default": True,
        "icon": "👁️",
    },
    {
        "name": "robotics",
        "display_name": "Robotics",
        "arxiv_category": "cs.RO",
        "arxiv_query": None,
        "is_default": True,
        "icon": "🦾",
    },
    {
        "name": "systems",
        "display_name": "Systems",
        "arxiv_category": "cs.SY",
        "arxiv_query": None,
        "is_default": True,
        "icon": "⚙️",
    },
    {
        "name": "nlp",
        "display_name": "Natural Language Processing",
        "arxiv_category": "cs.CL",
        "arxiv_query": "natural language processing",
        "is_default": True,
        "icon": "💬",
    },
    {
        "name": "rl",
        "display_name": "Reinforcement Learning",
        "arxiv_category": "cs.LG",
        "arxiv_query": "reinforcement learning",
        "is_default": True,
        "icon": "🎮",
    },
    {
        "name": "multimodal",
        "display_name": "Multimodal AI",
        "arxiv_category": "cs.CV",
        "arxiv_query": "multimodal",
        "is_default": True,
        "icon": "🎯",
    },
]
