#!/bin/bash

# Stage all changes
git add .

# Commit with timestamp
git commit -m "Auto update: $(date)" || echo "No changes to commit."

# Push to GitHub
git push origin main