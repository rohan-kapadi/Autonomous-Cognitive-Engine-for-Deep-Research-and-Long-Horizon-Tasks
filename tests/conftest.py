"""Pytest configuration and environment fixtures for ACE test suite."""

import os
import sys

# Ensure src and root are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Provide safe dummy defaults for external service credentials during test runs
# This allows tests with mocks to run in CI/local dev without requiring paid keys.
os.environ.setdefault("GROQ_API_KEY", "mock-groq-key-for-tests")
os.environ.setdefault("TAVILY_API_KEY", "mock-tavily-key-for-tests")
os.environ.setdefault("GOOGLE_API_KEY", "mock-google-key-for-tests")
os.environ.setdefault("TEMPORAL_ADDRESS", "localhost:7233")
os.environ.setdefault("TEMPORAL_TASK_QUEUE", "ace-research-test")
