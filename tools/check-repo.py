#!/usr/bin/env python3
"""Repository guard: refuses material that must never enter the repository.

  python3 tools/check-repo.py            checks the files staged for commit (used by the pre-commit hook)
  python3 tools/check-repo.py --all      checks every tracked file (used by CI)
  python3 tools/check-repo.py --authors  checks the e-mail addresses of the commits about to be pushed

What it refuses, and why (docs/design.md 30.21):
  1. Binary material (images, archives, models, libraries, pickles) that is not on the allow-list
     `tools/repo-allowlist.txt`. Screenshots and recordings of a real screen show other people's
     products, personal names, avatars and the owner's own work; only synthetic images are listed.
  2. Personal data: e-mail addresses (except no-reply addresses), absolute user paths such as
     C:\\Users\\name or /home/name, and any term listed in the local file `tools/.private-terms`
     (one term per line; the file is ignored by git, put names that must never appear there).
  3. Secrets: API keys, tokens and private keys.
  4. Files over 1 MB (models and datasets belong to their owners and are fetched by plugins).
"""
import fnmatch
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BINARY = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".ico", ".pkl", ".pickle", ".zip", ".7z", ".gz", ".tar", ".rar",
          ".exe", ".dll", ".so", ".dylib", ".onnx", ".pt", ".pth", ".bin", ".raw", ".mp4", ".mov", ".avi", ".wav", ".mp3", ".pdf", ".psd", ".db", ".sqlite"}
MAX_BYTES = 1_000_000
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")
ALLOWED_EMAIL = re.compile(r"(@users\.noreply\.github\.com|^noreply@|@example\.(com|org|net)$|^git@github\.com$)")
USER_PATH = re.compile(r"(?i)(?:[A-Z]:\\+Users\\+(?!<|%|\{|name|you|user|username|public|default|\.\.\.)[^\\/\s\"']+|/Users/(?!<|you|user|name|username)[a-z][^/\s\"']*|/home/(?!user\b|you\b|name\b|username\b|<)[a-z][^/\s\"']*)")
SECRETS = [
    ("an API key (sk-...)", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}")),
    ("a GitHub token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}")),
    ("an AWS access key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("a private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ED25519 )?PRIVATE KEY-----")),
    ("a Slack token", re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}")),
    ("a Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
]
# files that legitimately discuss these patterns
SELF = {"tools/check-repo.py", "tools/test-check-repo.py", "tools/repo-allowlist.txt", ".gitignore"}


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def allowlist() -> list[str]:
    path = ROOT / "tools" / "repo-allowlist.txt"
    if not path.exists():
        return []
    return [l.strip() for l in path.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]


def private_terms() -> list[str]:
    path = ROOT / "tools" / ".private-terms"
    if not path.exists():
        return []
    return [l.strip() for l in path.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]


def check_file(rel: str, data: bytes, allowed: list[str], terms: list[str]) -> list[str]:
    problems = []
    suffix = Path(rel).suffix.lower()
    if suffix in BINARY and not any(fnmatch.fnmatch(rel, pat) for pat in allowed):
        problems.append(f"{rel}: binary material that is not on tools/repo-allowlist.txt (real screenshots and third-party files must not be committed; add a synthetic file to the list deliberately)")
    if len(data) > MAX_BYTES and not any(fnmatch.fnmatch(rel, pat) for pat in allowed):
        problems.append(f"{rel}: {len(data) // 1000} KB is over the 1 MB limit")
    if suffix in BINARY or rel in SELF or len(data) > MAX_BYTES:
        return problems
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return problems + [f"{rel}: not text and not an allowed binary type"]
    for n, line in enumerate(text.split("\n"), 1):
        line = line[:4000]  # the patterns are linear on normal lines; very long lines are cut
        for m in (EMAIL.finditer(line) if "@" in line else ()):
            addr = m.group(0)
            if not ALLOWED_EMAIL.search(addr) and not rel.endswith("Cargo.lock"):
                problems.append(f"{rel}:{n}: e-mail address {addr}")
        m = USER_PATH.search(line)
        if m:
            problems.append(f"{rel}:{n}: absolute user path {m.group(0)!r}")
        for what, rx in SECRETS:
            if rx.search(line):
                problems.append(f"{rel}:{n}: looks like {what}")
        low = line.lower()
        for t in terms:
            if t.lower() in low:
                problems.append(f"{rel}:{n}: contains a private term from tools/.private-terms")
    return problems


def staged() -> list[str]:
    return [l for l in git("diff", "--cached", "--name-only", "--diff-filter=ACMR").split("\n") if l]


def tracked() -> list[str]:
    return [l for l in git("ls-files").split("\n") if l]


def read_staged(rel: str) -> bytes:
    return subprocess.run(["git", "show", f":{rel}"], cwd=ROOT, check=True, capture_output=True).stdout


def check_authors() -> list[str]:
    # commits that are not on any remote yet
    out = git("log", "--branches", "--not", "--remotes", "--format=%h %ae %ce") if subprocess.run(["git", "remote"], cwd=ROOT, capture_output=True, text=True).stdout.strip() else git("log", "--all", "--format=%h %ae %ce")
    problems = []
    for line in out.split("\n"):
        if not line:
            continue
        sha, *emails = line.split()
        for e in emails:
            if not ALLOWED_EMAIL.search(e):
                problems.append(f"commit {sha}: author or committer e-mail {e} is a personal address; set git config user.email to your GitHub no-reply address")
    return problems


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "--authors":
        problems = check_authors()
    else:
        allowed, terms = allowlist(), private_terms()
        files = tracked() if mode == "--all" else staged()
        problems = []
        for rel in files:
            path = ROOT / rel
            if mode == "--all":
                if not path.is_file():
                    continue
                data = path.read_bytes()
            else:
                data = read_staged(rel)
            problems += check_file(rel, data, allowed, terms)
    if problems:
        print("The repository guard refused this:\n", file=sys.stderr)
        for p in problems:
            print("  " + p, file=sys.stderr)
        print("\nNothing was committed or pushed. Remove the material, or (for a deliberate synthetic file) add it to tools/repo-allowlist.txt.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
