"""AI-assisted topic draft and refinement service using Gemini.

In LOCAL_DEV mode, returns deterministic placeholder drafts.
"""

from __future__ import annotations

import json
import os
from typing import Any

_LOCAL_DEV = os.environ.get("LOCAL_DEV", "").lower() in ("1", "true", "yes")
_DEFAULT_LANGUAGE_ID = os.environ.get("DEFAULT_LANGUAGE_ID", "es")


def generate_topic_draft(
    *,
    source_content: str,
    language_id: str,
    conversation_duration_minutes: int = 15,
    difficulty_level: str = "intermediate",
    focus_skills: list[str] | None = None,
    constraints: str | None = None,
) -> dict[str, Any]:
    """Generate an initial structured topic draft from source content."""
    if _LOCAL_DEV:
        return _local_dev_draft(
            source_content=source_content,
            language_id=language_id,
            conversation_duration_minutes=conversation_duration_minutes,
            difficulty_level=difficulty_level,
            focus_skills=focus_skills or [],
            constraints=constraints,
        )
    return _generate_with_gemini(
        mode="draft",
        source_content=source_content,
        language_id=language_id,
        conversation_duration_minutes=conversation_duration_minutes,
        difficulty_level=difficulty_level,
        focus_skills=focus_skills or [],
        constraints=constraints,
        current_draft=None,
        admin_instruction=None,
        conversation_summary=None,
    )


def refine_topic_draft(
    *,
    current_draft: dict[str, Any],
    admin_instruction: str,
    conversation_summary: str | None = None,
) -> dict[str, Any]:
    """Refine an existing topic draft using admin instructions."""
    if _LOCAL_DEV:
        refined = {**current_draft}
        refined["description"] = (
            f"{current_draft.get('description', '')} "
            f"(Refined: {admin_instruction[:80]})"
        ).strip()
        return _normalize_structured_draft(refined)
    return _generate_with_gemini(
        mode="refine",
        source_content="",
        language_id=str(current_draft.get("language_id", _DEFAULT_LANGUAGE_ID)),
        conversation_duration_minutes=int(
            current_draft.get("conversation_duration_minutes", 15)
        ),
        difficulty_level=str(current_draft.get("difficulty_level", "intermediate")),
        focus_skills=list(current_draft.get("focus_skills", [])),
        constraints=current_draft.get("constraints"),
        current_draft=current_draft,
        admin_instruction=admin_instruction,
        conversation_summary=conversation_summary,
    )


def _generate_with_gemini(
    *,
    mode: str,
    source_content: str,
    language_id: str,
    conversation_duration_minutes: int,
    difficulty_level: str,
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
  "description": "string",
  "conversation_prompt": "string",
  "difficulty_level": "string",
  "conversation_duration_minutes": 15,
  "focus_skills": ["speaking"],
  "constraints": "string or null",
  "key_vocabulary": ["word1", "word2"],
  "discussion_questions": [
    {
      "question": "string",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "cultural_notes": "string or null",
  "background_info": "string or null"
}
No markdown. No prose outside JSON.
""".strip()

    # Get the appropriate prompt from Firestore
    prompt_type = "topic_draft"
    system_prompt_doc = prompts_repo.get_active(language_id, prompt_type)
    
    if system_prompt_doc:
        base_prompt = system_prompt_doc["prompt_text"]
    else:
        # Fallback to default prompt
        base_prompt = (
            "You are helping an admin design a conversation topic. "
            "Create an engaging topic based on the provided source content."
        )

    if mode == "draft":
        prompt = f"""
{base_prompt}

Parameters:
- language_id: {language_id}
- conversation_duration_minutes: {conversation_duration_minutes}
- difficulty_level: {difficulty_level}
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

Please revise while preserving coherence and engagement quality.

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
    discussion_questions = raw.get("discussion_questions")
    if not isinstance(discussion_questions, list):
        discussion_questions = []
    
    normalized_questions: list[dict[str, Any]] = []
    for item in discussion_questions:
        if not isinstance(item, dict):
            continue
        question_text = str(item.get("question", "")).strip()
        difficulty = str(item.get("difficulty", "intermediate")).strip().lower()
        if question_text and difficulty in ("beginner", "intermediate", "advanced"):
            normalized_questions.append({
                "question": question_text,
                "difficulty": difficulty,
            })
    
    key_vocabulary = raw.get("key_vocabulary")
    if not isinstance(key_vocabulary, list):
        key_vocabulary = []
    normalized_vocab = [str(word).strip() for word in key_vocabulary if str(word).strip()]
    
    return {
        "title": str(raw.get("title", "")).strip(),
        "description": str(raw.get("description", "")).strip(),
        "conversation_prompt": str(raw.get("conversation_prompt", "")).strip(),
        "difficulty_level": str(raw.get("difficulty_level", "intermediate")).strip(),
        "conversation_duration_minutes": int(raw.get("conversation_duration_minutes", 15) or 15),
        "focus_skills": [str(skill).strip() for skill in raw.get("focus_skills", []) if str(skill).strip()],
        "constraints": raw.get("constraints"),
        "key_vocabulary": normalized_vocab,
        "discussion_questions": normalized_questions,
        "cultural_notes": raw.get("cultural_notes"),
        "background_info": raw.get("background_info"),
    }


def _local_dev_draft(
    *,
    source_content: str,
    language_id: str,
    conversation_duration_minutes: int,
    difficulty_level: str,
    focus_skills: list[str],
    constraints: str | None,
) -> dict[str, Any]:
    excerpt = source_content[:150].strip().replace("\n", " ")
    return {
        "title": "AI Draft Topic",
        "description": "Engaging conversation topic based on uploaded content.",
        "conversation_prompt": (
            "You are a conversation partner. Discuss the topic based on the uploaded "
            "source material. Ask open-ended questions and encourage the learner to "
            "express their opinions."
        ),
        "difficulty_level": difficulty_level,
        "conversation_duration_minutes": conversation_duration_minutes,
        "focus_skills": focus_skills,
        "constraints": constraints,
        "key_vocabulary": ["vocabulary1", "vocabulary2"],
        "discussion_questions": [
            {
                "question": "What do you think about this topic?",
                "difficulty": "beginner"
            },
            {
                "question": "How would you apply this in real life?",
                "difficulty": "intermediate"
            }
        ],
        "cultural_notes": "Relevant cultural context",
        "background_info": f"Based on source excerpt: {excerpt}",
    }
