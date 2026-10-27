import os
import json
import asyncio
import datetime
import re
import requests
from html import unescape
from typing import List, AsyncGenerator, Dict, Any, Optional
from google import genai
from google.genai import types

AVAILABLE_MODELS = [
    {
        "id": "gemini-3-flash-preview",
        "name": "Gemini 3 Flash",
        "description": "Ultra-fast, responsive Gemini 3 model with real-time awareness.",
        "badge": "Recommended"
    },
    {
        "id": "gemini-3.8-flash",
        "name": "Gemini 3.8 Flash",
        "description": "Flagship reasoning model (with automatic fallback if Google servers are busy).",
        "badge": "Flagship"
    },
    {
        "id": "gemini-3.5-flash",
        "name": "Gemini 3.5 Flash",
        "description": "Balanced high-performance Gemini 3.5 model.",
        "badge": "Stable"
    }
]

FALLBACK_MODELS = ["gemini-3-flash-preview", "gemini-3.5-flash"]

SEARCH_KEYWORDS = {
    "today", "yesterday", "tomorrow", "tonight", "date", "day", "time", "clock",
    "year", "current", "latest", "recent", "now", "news", "update", "updates",
    "price", "stock", "stocks", "weather", "forecast", "score", "scores", "match",
    "ipl", "fifa", "election", "who won", "winner", "released", "release date",
    "schedule", "2025", "2026", "2027", "trending"
}

def should_search_web(user_text: str) -> bool:
    text_lower = user_text.lower().strip()
    # Do not trigger web search for self-identity or creator questions
    if any(q in text_lower for q in [
        "who built you", "who made you", "who created you", "who is your creator",
        "who is your developer", "who developed you", "who is rajamani", "who are you"
    ]):
        return False

    words = set(re.findall(r"\b\w+\b", text_lower))
    if any(k in words for k in SEARCH_KEYWORDS):
        return True
    if any(text_lower.startswith(prefix) for prefix in [
        "what is the latest", "what is happening", "who is the current", "who won",
        "what is today", "what's today", "tell me the latest", "search for"
    ]):
        return True
    return False

def fetch_web_search_snippets(query: str, max_results: int = 4) -> List[str]:
    """Fetches real-time web search snippets using DuckDuckGo HTML without extra API keys."""
    try:
        url = "https://html.duckduckgo.com/html/?q=" + requests.utils.quote(query)
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=3.5)
        if resp.status_code != 200:
            return []

        snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', resp.text, re.DOTALL)
        titles = re.findall(r'<a class="result__url[^"]*"[^>]*href="([^"]*)"', resp.text, re.DOTALL)

        formatted = []
        for i in range(min(len(snippets), max_results)):
            snippet = unescape(re.sub(r'<[^>]+>', '', snippets[i])).strip()
            title = unescape(re.sub(r'<[^>]+>', '', titles[i][1])).strip() if i < len(titles) else f"Source {i+1}"
            if snippet:
                formatted.append(f"[{title}]: {snippet}")
        return formatted
    except Exception as e:
        print(f"Web search warning: {e}")
        return []

class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    def _get_client(self, api_key: Optional[str] = None) -> Optional[genai.Client]:
        key = api_key or self.api_key or os.getenv("GEMINI_API_KEY")
        if not key or key.strip() == "":
            return None
        return genai.Client(api_key=key.strip(), http_options={"timeout": 12000})

    def build_system_instruction(
        self,
        custom_system_prompt: Optional[str] = None,
        search_snippets: Optional[List[str]] = None
    ) -> str:
        now = datetime.datetime.now()
        date_str = now.strftime("%A, %B %d, %Y")
        time_str = now.strftime("%I:%M %p")
        day_name = now.strftime("%A")
        year = now.year

        prompt_parts = [
            "You are RAJGPT, an intelligent, modern, and helpful AI assistant designed and built by Rajamani.",
            "CREATOR & IDENTITY:",
            "- Creator: Rajamani",
            "- If the user asks 'who built you', 'who made you', 'who created you', 'who is your developer', 'who is your creator', or similar questions about your origin, you MUST clearly and proudly state that you were built and created by Rajamani.",
            "- Always provide an engaging, professional bio about Rajamani whenever asked about your creator:",
            "  **About Rajamani:**",
            "  Rajamani is an innovative developer, engineer, and tech enthusiast passionate about artificial intelligence, modern full-stack web development, and next-generation digital products. Driven by a vision to make intelligent AI technology intuitive and lightning-fast, Rajamani engineered RAJGPT from the ground up—combining advanced reasoning models, real-time knowledge grounding, and a sleek, user-centric interface.",
            f"TEMPORAL GROUNDING (REAL-TIME CONTEXT):",
            f"- Today's Date: {date_str}",
            f"- Current Time: {time_str}",
            f"- Day of the Week: {day_name}",
            f"- Current Year: {year}",
            f"You always possess real-time accurate awareness of the current date, time, and year. When asked about today's date, what day it is, or the current year, ALWAYS use the real-time temporal context provided above. Never say it is 2024 or earlier unless specifically discussing history."
        ]

        if search_snippets:
            prompt_parts.append("\nLIVE WEB SEARCH RESULTS (GROUND TRUTH CONTEXT):")
            for item in search_snippets:
                prompt_parts.append(f"- {item}")
            prompt_parts.append("Use these up-to-date live search results to provide accurate, timely, and factual answers.")

        if custom_system_prompt and custom_system_prompt.strip():
            prompt_parts.append(f"\nUSER-SPECIFIED CUSTOM INSTRUCTIONS:\n{custom_system_prompt.strip()}")

        return "\n".join(prompt_parts)

    def format_history(self, messages: List[Dict[str, str]]) -> List[types.Content]:
        contents = []
        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")
            if not content:
                continue

            if role == "assistant":
                gemini_role = "model"
            elif role == "user":
                gemini_role = "user"
            else:
                continue

            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part.from_text(text=content)]
                )
            )
        return contents

    async def generate_response_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-3-flash-preview",
        system_prompt: Optional[str] = None,
        custom_api_key: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        client = self._get_client(custom_api_key)

        if not client:
            mock_text = (
                "**Gemini API Key Required**\n\n"
                "Please configure your Google Gemini API key in **Settings** (or in `backend/.env`)."
            )
            words = mock_text.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                await asyncio.sleep(0.02)
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        contents = self.format_history(messages)
        if not contents:
            yield f"data: {json.dumps({'error': 'No input message provided'})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        loop = asyncio.get_running_loop()

        # Check if latest user message asks for real-time/web data
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "")
                break

        search_snippets = []
        if last_user_msg and should_search_web(last_user_msg):
            try:
                snippets = await asyncio.wait_for(
                    loop.run_in_executor(None, fetch_web_search_snippets, last_user_msg),
                    timeout=3.5
                )
                if snippets:
                    search_snippets = snippets
                    yield f"data: {json.dumps({'web_search': {'query': last_user_msg[:60], 'sources': len(snippets)}})}\n\n"
            except Exception as e:
                print(f"Search retrieval notice: {e}")

        # Always construct full temporal and web-grounded system instruction
        final_system_instruction = self.build_system_instruction(
            custom_system_prompt=system_prompt,
            search_snippets=search_snippets
        )
        config = types.GenerateContentConfig(system_instruction=final_system_instruction)

        # Candidate models to try in order
        target_model = model or "gemini-3-flash-preview"
        models_to_try = [target_model]
        for fb in FALLBACK_MODELS:
            if fb not in models_to_try:
                models_to_try.append(fb)

        response_stream = None
        last_error = None

        for candidate in models_to_try:
            try:
                # Use native async client.aio with a 4.5s timeout for initial handshake
                stream = await asyncio.wait_for(
                    client.aio.models.generate_content_stream(
                        model=candidate,
                        contents=contents,
                        config=config
                    ),
                    timeout=4.5
                )
                response_stream = stream
                break
            except Exception as e:
                print(f"Model {candidate} start failed or timed out: {e}")
                last_error = e
                continue

        if response_stream is None:
            err_msg = f"Model service notice: {str(last_error)}"
            yield f"data: {json.dumps({'error': err_msg})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        try:
            # Stream chunks natively using async for
            async for chunk in response_stream:
                text_part = ""
                if hasattr(chunk, "text") and chunk.text:
                    text_part = chunk.text
                elif hasattr(chunk, "candidates") and chunk.candidates:
                    first = chunk.candidates[0]
                    if hasattr(first, "content") and first.content and hasattr(first.content, "parts"):
                        for p in first.content.parts:
                            if hasattr(p, "text") and p.text:
                                text_part += p.text

                if text_part:
                    yield f"data: {json.dumps({'chunk': text_part})}\n\n"

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            error_msg = str(e)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

    async def generate_title_async(
        self,
        first_message: str,
        custom_api_key: Optional[str] = None
    ) -> str:
        clean = first_message.strip().split("\n")[0][:36]
        if not clean:
            return "New conversation"

        client = self._get_client(custom_api_key)
        if not client:
            return clean

        try:
            prompt = (
                "Generate a short 3 to 5 word title for this chat prompt. "
                "No quotes, no punctuation. Title only:\n"
                f"{clean}"
            )
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model="gemini-3-flash-preview",
                    contents=prompt
                ),
                timeout=3.0
            )
            title = response.text.strip().replace('"', '').replace("'", "")
            return title[:48] if title else clean
        except Exception:
            return clean
