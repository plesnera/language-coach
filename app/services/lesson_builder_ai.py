"""AI-assisted lesson draft and refinement service using Gemini.

In LOCAL_DEV mode, returns deterministic placeholder drafts.
"""

from __future__ import annotations

import json
import os
from typing import Any

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")
_DEFAULT_LANGUAGE_ID = os.environ.get("DEFAULT_LANGUAGE_ID", "es")


def generate_lesson_draft(
    *,
    source_content: str,
    language_id: str,
    learner_level: str,
    lesson_length_minutes: int,
    focus_skills: list[str],
    constraints: str | None = None,
) -> dict[str, Any]:
    """Generate an initial structured lesson draft from source content."""
    if _LOCAL_DEV:
        return _local_dev_draft(
            source_content=source_content,
            language_id=language_id,
            learner_level=learner_level,
            lesson_length_minutes=lesson_length_minutes,
            focus_skills=focus_skills,
            constraints=constraints,
        )
    return _generate_with_gemini(
        mode="draft",
        source_content=source_content,
        language_id=language_id,
        learner_level=learner_level,
        lesson_length_minutes=lesson_length_minutes,
        focus_skills=focus_skills,
        constraints=constraints,
        current_draft=None,
        admin_instruction=None,
        conversation_summary=None,
    )


def refine_lesson_draft(
    *,
    current_draft: dict[str, Any],
    admin_instruction: str,
    conversation_summary: str | None = None,
) -> dict[str, Any]:
    """Refine an existing lesson draft using admin instructions."""
    if _LOCAL_DEV:
        refined = {**current_draft}
        refined["objective"] = (
            f"{current_draft.get('objective', '')} "
            f"(Refined: {admin_instruction[:80]})"
        ).strip()
        return _normalize_structured_draft(refined)
    return _generate_with_gemini(
        mode="refine",
        source_content="",
        language_id=str(current_draft.get("ai_generation_context", {}).get("language_id", _DEFAULT_LANGUAGE_ID)),
        learner_level=str(
            current_draft.get("ai_generation_context", {}).get("learner_level", "beginner")
        ),
        lesson_length_minutes=int(
            current_draft.get("ai_generation_context", {}).get("lesson_length_minutes", 10)
        ),
        focus_skills=list(current_draft.get("ai_generation_context", {}).get("focus_skills", [])),
        constraints=current_draft.get("ai_generation_context", {}).get("constraints"),
        current_draft=current_draft,
        admin_instruction=admin_instruction,
        conversation_summary=conversation_summary,
    )


def _generate_with_gemini(
    *,
    mode: str,
    source_content: str,
    language_id: str,
    learner_level: str,
    lesson_length_minutes: int,
    focus_skills: list[str],
    constraints: str | None,
    current_draft: dict[str, Any] | None,
    admin_instruction: str | None,
    conversation_summary: str | None,
) -> dict[str, Any]:
    from google import genai
    from app.db import system_prompts as prompts_repo

    client = genai.Client()
    schema_hint = """
Return only valid JSON with this shape:
{
  "title": "string",
  "objective": "string",
  "teaching_prompt": "string",
  "prompt_design_notes": "string",
  "visual_aids": [
    {
      "type": "table|diagram",
      "title": "string",
      "description": "string",
      "data": {}
    }
  ],
  "ai_generation_context": {
    "language_id": "string",
    "learner_level": "string",
    "lesson_length_minutes": 10,
    "focus_skills": ["speaking"],
    "constraints": "string or null"
  }
}
No markdown. No prose outside JSON.
""".strip()

    # Get the appropriate prompt from Firestore
    prompt_type = "lesson_draft" if mode == "draft" else "lesson_draft"  # Both use lesson_draft for now
    system_prompt_doc = prompts_repo.get_active(language_id, prompt_type)
    
    if system_prompt_doc:
        base_prompt = system_prompt_doc["prompt_text"]
    else:
        # Fallback to default prompt
        base_prompt = (
            "You are helping an admin design a language lesson. "
            "Create a high-quality first draft based on the provided source content."
        )

    if mode == "draft":
        prompt = f"""
{base_prompt}

Parameters:
- language_id: {language_id}
- learner_level: {learner_level}
- lesson_length_minutes: {lesson_length_minutes}
- focus_skills: {focus_skills}
- constraints: {constraints or "none"}

Source content:
{source_content}

{schema_hint}
""".strip()
    else:
        prompt = f"""
{base_prompt}

Current draft JSON:
{json.dumps(current_draft or {}, ensure_ascii=False)}

Admin instruction:
{admin_instruction or ""}

Conversation summary:
{conversation_summary or ""}

Please revise while preserving coherence and teaching quality.

{schema_hint}
""".strip()

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    text = response.text or "{}"
    return _normalize_structured_draft(_parse_json_safely(text))


def _parse_json_safely(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    return {}


def _normalize_structured_draft(raw: dict[str, Any]) -> dict[str, Any]:
    visual_aids = raw.get("visual_aids")
    if not isinstance(visual_aids, list):
        visual_aids = []
    normalized_visuals: list[dict[str, Any]] = []
    for item in visual_aids:
        if not isinstance(item, dict):
            continue
        aid_type = str(item.get("type", "")).strip().lower()
        if aid_type not in ("table", "diagram"):
            continue
        normalized_visuals.append(
            {
                "type": aid_type,
                "title": str(item.get("title", "")).strip(),
                "description": str(item.get("description", "")).strip(),
                "data": item.get("data", {}),
            }
        )
    context = raw.get("ai_generation_context")
    if not isinstance(context, dict):
        context = {}
    return {
        "title": str(raw.get("title", "")).strip(),
        "objective": str(raw.get("objective", "")).strip(),
        "teaching_prompt": str(raw.get("teaching_prompt", "")).strip(),
        "prompt_design_notes": str(raw.get("prompt_design_notes", "")).strip(),
        "visual_aids": normalized_visuals,
        "ai_generation_context": {
            "language_id": str(context.get("language_id", "")).strip(),
            "learner_level": str(context.get("learner_level", "")).strip(),
            "lesson_length_minutes": int(context.get("lesson_length_minutes", 0) or 0),
            "focus_skills": [
                str(skill).strip()
                for skill in context.get("focus_skills", [])
                if str(skill).strip()
            ],
            "constraints": context.get("constraints"),
        },
    }


def _local_dev_draft(
    *,
    source_content: str,
    language_id: str,
    learner_level: str,
    lesson_length_minutes: int,
    focus_skills: list[str],
    constraints: str | None,
) -> dict[str, Any]:
    excerpt = source_content[:220].strip().replace("\n", " ")
    return {
        "title": "AI Draft Lesson",
        "objective": "Practice a short guided dialogue with focused corrections.",
        "teaching_prompt": (
            "You are a patient language coach. Guide the learner through a dialogue "
            "based on the uploaded source material. Ask short questions, provide "
            "examples, and gently correct mistakes."
        ),
        "prompt_design_notes": f"Built from source excerpt: {excerpt}",
        "visual_aids": [],
        "ai_generation_context": {
            "language_id": language_id,
            "learner_level": learner_level,
            "lesson_length_minutes": lesson_length_minutes,
            "focus_skills": focus_skills,
            "constraints": constraints,
        },
    }
