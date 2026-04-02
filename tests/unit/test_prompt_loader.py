"""Unit tests for app.agents.prompt_loader."""

from __future__ import annotations

from unittest.mock import patch


def test_returns_firestore_value_when_active_prompt_exists() -> None:
    """When an active prompt exists in Firestore, return its text."""
    with patch(
        "app.db.system_prompts.get_active",
        return_value={"prompt_text": "Firestore prompt"},
    ):
        import app.agents.prompt_loader

        result = app.agents.prompt_loader.load_prompt("es", "beginner")
    assert result == "Firestore prompt"


def test_seeds_defaults_and_returns_prompt_when_initial_lookup_misses() -> None:
    """When no active prompt exists, defaults are seeded and lookup is retried."""
    with (
        patch(
            "app.db.system_prompts.get_active",
            side_effect=[None, {"prompt_text": "Seeded prompt"}],
        ) as get_active_mock,
        patch("app.db.system_prompts.seed_defaults") as seed_defaults_mock,
    ):
        import app.agents.prompt_loader

        result = app.agents.prompt_loader.load_prompt("es", "topic")
    assert result == "Seeded prompt"
    seed_defaults_mock.assert_called_once_with()
    assert get_active_mock.call_count == 2


def test_raises_when_no_active_prompt_exists_after_seeding() -> None:
    """When prompt remains missing after seeding, a RuntimeError is raised."""
    with (
        patch("app.db.system_prompts.get_active", side_effect=[None, None]),
        patch("app.db.system_prompts.seed_defaults"),
    ):
        import app.agents.prompt_loader

        try:
            app.agents.prompt_loader.load_prompt("es", "router")
            assert False, "Expected RuntimeError"
        except RuntimeError as exc:
            assert "Missing active system prompt for es/router" in str(exc)


def test_raises_on_exception() -> None:
    """When Firestore raises, a RuntimeError is raised."""
    with patch(
        "app.db.system_prompts.get_active",
        side_effect=RuntimeError("connection failed"),
    ):
        import app.agents.prompt_loader

        try:
            app.agents.prompt_loader.load_prompt("es", "router")
            assert False, "Expected RuntimeError"
        except RuntimeError as exc:
            assert "Missing active system prompt for es/router" in str(exc)
