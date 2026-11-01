#!/bin/sh
# One-time setup after cloning: use the repository's hooks and a no-reply address.
set -e
cd "$(git rev-parse --show-toplevel)"
chmod +x .githooks/* tools/check-repo.py
git config core.hooksPath .githooks
echo "hooks installed. Set your commit address to the GitHub no-reply one, for example:"
echo "  git config user.email YOUR-ID+YOUR-NAME@users.noreply.github.com"
echo "and turn on 'Keep my email addresses private' and 'Block command line pushes that expose my email' in GitHub, Settings, Emails."
