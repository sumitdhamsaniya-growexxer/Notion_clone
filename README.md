# Notion Clone — Block Document Editor

A browser-based block document editor built from scratch. No Tiptap, Slate, or ProseMirror.
Uses contenteditable for all text blocks.

## Live URL
https://frontend-delta-red-27.vercel.app/

## Setup (Docker — Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/yourname/notion-clone
cd notion-clone

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Edit backend/.env with your secrets
# (JWT_SECRET, DB_PASSWORD etc.)

# 4. Start everything
docker-compose up --build

# App runs at http://localhost:3000
# API runs at http://localhost:5000
