"""Unit tests for WebSocketToQueueAdapter in expose_app.py."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.app_utils.expose_app import WebSocketToQueueAdapter


@pytest.fixture()
def mock_websocket() -> AsyncMock:
    ws = AsyncMock()
    ws.send_json = AsyncMock()
    return ws


@pytest.fixture()
def adapter(mock_websocket: AsyncMock) -> WebSocketToQueueAdapter:
    return WebSocketToQueueAdapter(mock_websocket, agent_engine=MagicMock())


# ── receive_from_client ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_receive_puts_valid_messages_on_queue(
    adapter: WebSocketToQueueAdapter, mock_websocket: AsyncMock
) -> None:
    """Valid JSON text messages should be placed on the input queue."""
    msg = {"content": {"role": "user", "parts": [{"text": "Hola"}]}}
    mock_websocket.receive = AsyncMock(
        side_effect=[
            {"text": json.dumps(msg)},
            Exception("done"),  # break the loop
        ]
    )
    await adapter.receive_from_client()
    assert not adapter.input_queue.empty()
    queued = adapter.input_queue.get_nowait()
    assert queued == msg


@pytest.mark.asyncio
async def test_receive_skips_setup_messages(
    adapter: WebSocketToQueueAdapter, mock_websocket: AsyncMock
) -> None:
    """Setup messages should be logged but NOT placed on the queue."""
    setup_msg = {"setup": {"model": "gemini-live"}}
    mock_websocket.receive = AsyncMock(
        side_effect=[
            {"text": json.dumps(setup_msg)},
            Exception("done"),
        ]
    )
    await adapter.receive_from_client()
    assert adapter.input_queue.empty()


@pytest.mark.asyncio
async def test_receive_handles_malformed_json(
    adapter: WebSocketToQueueAdapter, mock_websocket: AsyncMock
) -> None:
    """Malformed JSON should not crash the loop."""
    mock_websocket.receive = AsyncMock(
        side_effect=[
            {"text": "not valid json {{"},
        ]
    )
    # Should exit cleanly due to JSONDecodeError
    await adapter.receive_from_client()
    assert adapter.input_queue.empty()


@pytest.mark.asyncio
async def test_receive_exits_on_connection_closed(
    adapter: WebSocketToQueueAdapter, mock_websocket: AsyncMock
) -> None:
    """ConnectionClosedError should terminate the receive loop cleanly."""
    from websockets.exceptions import ConnectionClosedError

    mock_websocket.receive = AsyncMock(side_effect=ConnectionClosedError(None, None))
    await adapter.receive_from_client()
    assert adapter.input_queue.empty()


# ── _transform_remote_agent_engine_response ────────────────────────────────


def test_transform_unwraps_bidi_stream_output(
    adapter: WebSocketToQueueAdapter,
) -> None:
    """bidiStreamOutput should be unwrapped."""
    response = {
        "bidiStreamOutput": {
            "serverContent": {"modelTurn": {"parts": [{"text": "¡Hola!"}]}}
        }
    }
    result = adapter._transform_remote_agent_engine_response(response)
    assert "serverContent" in result
    assert "bidiStreamOutput" not in result


def test_transform_passes_through_non_bidi(
    adapter: WebSocketToQueueAdapter,
) -> None:
    """Non-bidiStreamOutput responses should pass through unchanged."""
    response = {"serverContent": {"turnComplete": True}}
    result = adapter._transform_remote_agent_engine_response(response)
    assert result == response
