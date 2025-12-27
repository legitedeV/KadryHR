#!/bin/bash

# Script to create Pull Request using GitHub CLI or API
# Usage: ./create-pr.sh [GITHUB_TOKEN]

set -e

REPO="legitedeV/KadryHR"
BRANCH="refactor/production-grade-schedule-system"
BASE="main"
TITLE="Refactor Schedule Builder to Production-Grade Quality"

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo "Using GitHub CLI to create PR..."
    gh pr create \
        --repo "$REPO" \
        --base "$BASE" \
        --head "$BRANCH" \
        --title "$TITLE" \
        --body-file PR_DESCRIPTION.md
    echo "✅ Pull Request created successfully!"
    exit 0
fi

# Fallback to curl with GitHub API
if [ -z "$1" ]; then
    echo "❌ Error: GitHub token required"
    echo ""
    echo "Usage:"
    echo "  1. Using GitHub CLI (recommended):"
    echo "     gh auth login"
    echo "     ./create-pr.sh"
    echo ""
    echo "  2. Using GitHub token:"
    echo "     ./create-pr.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "  3. Manual PR creation:"
    echo "     Visit: https://github.com/$REPO/pull/new/$BRANCH"
    echo "     Copy content from PR_DESCRIPTION.md"
    exit 1
fi

TOKEN="$1"
PR_BODY=$(cat PR_DESCRIPTION.md)

echo "Creating PR using GitHub API..."

RESPONSE=$(curl -s -X POST \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/pulls" \
    -d @- <<EOF
{
  "title": "$TITLE",
  "body": $(echo "$PR_BODY" | jq -Rs .),
  "head": "$BRANCH",
  "base": "$BASE"
}
EOF
)

PR_URL=$(echo "$RESPONSE" | jq -r '.html_url')

if [ "$PR_URL" != "null" ]; then
    echo "✅ Pull Request created successfully!"
    echo "🔗 URL: $PR_URL"
else
    echo "❌ Error creating PR:"
    echo "$RESPONSE" | jq .
    exit 1
fi
