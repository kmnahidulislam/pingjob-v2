#!/bin/bash

echo "🚀 [deploy.sh] Starting auto-push..."

git status

git add .
echo "🚀 [deploy.sh] Staged changes: $(git diff --cached --name-only)"

git commit -m "Auto update: $(date)" || echo "🚀 [deploy.sh] Nothing to commit."

echo "🚀 [deploy.sh] Running git push..."
git push origin main && echo "✅ [deploy.sh] Push succeeded" || echo "❌ [deploy.sh] Push failed"