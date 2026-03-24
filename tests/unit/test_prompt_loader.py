"""Unit tests for app.agents.prompt_loader."""

from __future__ import annotations

from unittest.mock import MagicMock, patch


def test_returns_firestore_value_when_active_prompt_exists() -> None:
    """When an active prompt exists in Firestore, return its text."""
    mock_prompts = MagicMock()
    mock_prompts.get_active.return_value = {"prompt_text": "Firestore prompt"}

    with patch.dict("sys.modules", {"app.db.system_prompts": mock_prompts}):
        # Re-import to pick up the mock
        from importlib import reload

        import app.agents.prompt_loader

        reload(app.agents.prompt_loader)
        result = app.agents.prompt_loader.load_prompt("es", "beginner", "fallback")
    assert result == "Firestore prompt"


def test_returns_default_when_no_active_prompt() -> None:
    """When Firestore returns None, the default is used."""
    mock_prompts = MagicMock()
    mock_prompts.get_active.return_value = None

    with patch.dict("sys.modules", {"app.db.system_prompts": mock_prompts}):
        from importlib import reload

        import app.agents.prompt_loader

        reload(app.agents.prompt_loader)
        result = app.agents.prompt_loader.load_prompt("es", "topic", "my default")
    assert result == "my default"


def test_returns_default_on_exception() -> None:
    """When Firestore raises, the default is returned."""
    mock_prompts = MagicMock()
    mock_prompts.get_active.side_effect = RuntimeError("connection failed")

    with patch.dict("sys.modules", {"app.db.system_prompts": mock_prompts}):
        from importlib import reload

        import app.agents.prompt_loader

        reload(app.agents.prompt_loader)
        result = app.agents.prompt_loader.load_prompt("es", "router", "emergency")
    assert result == "emergency"
