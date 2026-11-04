"""Offline smoke checks for the brain, endpoint authentication, and persisted queue.

Run from repo root:
    python -m unittest discover -s backend/tests -v
"""
from __future__ import annotations

import importlib
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("PET_API_TOKEN", "test-secret-do-not-use-in-production-123456")

import brain


class ConversationBrainTests(unittest.TestCase):
    def setUp(self):
        self.world = {
            "name": "Pip",
            "location": "grove",
            "activity": "Examining leaves by the stream",
            "plan": {"action": "Read about butterflies", "reason": "The woodland feels curious today"},
            "stats": {"hunger": 72, "energy": 61, "social": 74, "joy": 84, "curiosity": 79},
            "interests": {"butterflies": 5, "stars": 2},
            "memories": ["My friend likes strawberries"],
            "journal": [{"title": "Today's walk", "text": "I visited the stone circle"}],
            "discoveries": [{"title": "Butterfly", "summary": "A butterfly is an insect.", "url": "https://en.wikipedia.org/wiki/Butterfly"}],
            "messages": [
                {"from": "you", "text": "Hello Pip!"},
                {"from": "pet", "text": "Hello. The trees were lovely today."},
            ],
        }

    def test_context_contains_only_given_memories(self):
        result = brain.context(self.world)
        self.assertIn("strawberries", result)
        self.assertIn("stone circle", result)
        self.assertIn("butterflies", result)
        self.assertIn("https://en.wikipedia.org/wiki/Butterfly", result)
        self.assertNotIn("purple llamas", result)

    def test_recent_chat_roles(self):
        result = brain._recent_letters(self.world)
        self.assertEqual(result[0]["role"], "user")
        self.assertEqual(result[-1]["role"], "assistant")

    def test_local_reply_is_helpful_without_model(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "", "OLLAMA_URL": "", "OLLAMA_MODEL": ""}):
            result = brain.generate_reply(self.world, "How was your day?")
            self.assertIsInstance(result, str)
            self.assertGreater(len(result), 18)
            self.assertLess(len(result), 500)

    def test_explicit_memories_not_automatically_inferred(self):
        original = list(self.world["memories"])
        brain.fallback(self.world, "I love chocolate")
        self.assertEqual(self.world["memories"], original)

    def test_mode_selection(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "", "OLLAMA_URL": "", "OLLAMA_MODEL": ""}):
            self.assertEqual(brain.model_mode(), "fallback")
        with patch.dict(os.environ, {"OPENAI_API_KEY": "fake-model-test-key", "OLLAMA_URL": "", "OLLAMA_MODEL": ""}):
            self.assertEqual(brain.model_mode(), "openai")


class ApiSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.folder = tempfile.TemporaryDirectory()
        os.environ["DATA_DIR"] = cls.folder.name
        import main
        cls.main = main
        from fastapi.testclient import TestClient
        cls.client = TestClient(main.app)
        cls.headers = {"Authorization": "Bearer " + os.environ["PET_API_TOKEN"]}

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        cls.folder.cleanup()

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_authentication_and_pending_redaction(self):
        self.assertEqual(self.client.get("/api/state").status_code, 401)
        r = self.client.post("/api/message", headers=self.headers,
                             json={"text": "A private example letter"})
        self.assertEqual(r.status_code, 200)
        state = self.client.get("/api/state", headers=self.headers).json()
        self.assertTrue(state["pending"])
        self.assertNotIn("text", state["pending"][0])
        self.assertIn("A private example letter", [m["text"] for m in state["messages"]])

    def test_approved_memory_lifecycle(self):
        r = self.client.post("/api/memories", headers=self.headers,
                             json={"text": "I like gardening"})
        self.assertEqual(r.status_code, 200)
        state = self.client.get("/api/state", headers=self.headers).json()
        self.assertIn("I like gardening", state["memories"])
        index = state["memories"].index("I like gardening")
        self.assertEqual(self.client.delete("/api/memories/" + str(index),
                                            headers=self.headers).status_code, 200)
        state = self.client.get("/api/state", headers=self.headers).json()
        self.assertNotIn("I like gardening", state["memories"])

    def test_cors_delete_allowed(self):
        response = self.client.options(
            "/api/memories/0",
            headers={"Origin": "https://veritycooper.github.io",
                     "Access-Control-Request-Method": "DELETE",
                     "Access-Control-Request-Headers": "authorization"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "https://veritycooper.github.io")


if __name__ == "__main__":
    unittest.main()
