#!/usr/bin/env python3
"""Tests of the repository guard: it must refuse each kind of material and accept clean files."""
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import importlib.util

spec = importlib.util.spec_from_file_location("guard", ROOT / "tools" / "check-repo.py")
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)

ALLOW = ["assets/icons/*.png"]


def bad(rel, content, terms=()):
    return guard.check_file(rel, content if isinstance(content, bytes) else content.encode(), ALLOW, list(terms))


def main() -> None:
    # clean text passes
    assert bad("src/a.rs", "fn main() { println!(\"hello\"); } // contact: noreply@anthropic.com") == []
    assert bad("a.md", "Use noctide@users.noreply.github.com or someone@example.com") == []
    # personal e-mail addresses
    assert any("e-mail" in p for p in bad("a.md", "mail me: jane.doe@gmail.com"))
    # absolute user paths (real names), but placeholders are fine
    assert any("user path" in p for p in bad("a.py", r'open("C:\Users\Jane\Pictures\x.png")'))
    assert any("user path" in p for p in bad("a.py", 'open("/home/jane/secret.txt")'))
    assert any("user path" in p for p in bad("a.py", 'open("/Users/jane/Desktop")'))
    assert bad("a.md", r"%USERPROFILE%\Pictures and C:\Users\<you>\x and /home/user/x") == []
    # secrets
    assert any("API key" in p for p in bad("a.js", 'const k = "sk-' + "a" * 30 + '"'))
    assert any("GitHub token" in p for p in bad("a.sh", "token=ghp_" + "b" * 30))
    assert any("private key" in p for p in bad("a.pem", "-----BEGIN PRIVATE KEY-----\nabc"))
    assert any("AWS" in p for p in bad("a.txt", "AKIA" + "A" * 16))
    # binary material: refused unless listed
    assert any("allowlist" in p for p in bad("prototype/tests/real_chrome.png", b"\x89PNG"))
    assert any("allowlist" in p for p in bad("models/x.onnx", b"onnx"))
    assert bad("assets/icons/preview.png", b"\x89PNG") == []
    assert any("1 MB" in p for p in bad("data.txt", "x" * 1_100_000))
    # private terms, case-insensitive
    assert any("private term" in p for p in bad("a.md", "written by Jane Doe", terms=["jane doe"]))
    assert bad("a.md", "written by someone", terms=["jane doe"]) == []
    # the push check refuses personal commit addresses (in a throwaway repository)
    with tempfile.TemporaryDirectory() as d:
        run = lambda *a: subprocess.run(a, cwd=d, check=True, capture_output=True, text=True)
        run("git", "init", "-q")
        run("git", "-c", "user.name=A", "-c", "user.email=a.person@gmail.com", "commit", "--allow-empty", "-qm", "x")
        run("git", "-c", "user.name=A", "-c", "user.email=1+a@users.noreply.github.com", "commit", "--allow-empty", "-qm", "y")
        out = subprocess.run([sys.executable, str(ROOT / "tools" / "check-repo.py"), "--authors"], cwd=d, capture_output=True, text=True)
        # the guard always looks at its own repository, so run its function against the throwaway one
        guard.ROOT = Path(d)
        problems = guard.check_authors()
        assert len(problems) == 2 and all("a.person@gmail.com" in p for p in problems), problems
    print("check-repo: all guard tests passed")


if __name__ == "__main__":
    main()
