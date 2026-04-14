-- =============================================
-- Database Initialization Script
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL DEFAULT 'Untitled',
  share_token VARCHAR(64) UNIQUE,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  version     INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocks table — order_index MUST be FLOAT/DECIMAL per spec
CREATE TABLE IF NOT EXISTS blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL DEFAULT 'paragraph',
  content       JSONB NOT NULL DEFAULT '{}',
  order_index   DECIMAL(20, 10) NOT NULL,
  parent_id     UUID REFERENCES blocks(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(512) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_share_token ON documents(share_token);
CREATE INDEX IF NOT EXISTS idx_blocks_document_id ON blocks(document_id);
CREATE INDEX IF NOT EXISTS idx_blocks_order_index ON blocks(document_id, order_index);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Auto-update updated_at on documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocks_updated_at ON blocks;
CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Valid block types constraint
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check
  CHECK (type IN ('paragraph','heading_1','heading_2','heading_3','heading_4','bullet_list','numbered_list','table','todo','code','file','divider','image'));
