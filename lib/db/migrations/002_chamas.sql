-- ============================================
-- 2. CHAMAS (GROUP CONTAINERS)
-- ============================================

CREATE TABLE chamas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    chama_type TEXT NOT NULL CHECK (chama_type IN ('savings', 'merry_go_round', 'hybrid')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    invite_code TEXT UNIQUE NOT NULL,
    is_private INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 50,
    cover_image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_chamas_creator ON chamas(created_by);
CREATE INDEX idx_chamas_invite ON chamas(invite_code);

CREATE TABLE chama_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'removed', 'left')),
    joined_at TEXT DEFAULT (datetime('now')),
    removed_at TEXT,
    removed_by TEXT REFERENCES users(id),
    UNIQUE(chama_id, user_id)
);

CREATE INDEX idx_chama_members_chama ON chama_members(chama_id);
CREATE INDEX idx_chama_members_user ON chama_members(user_id);

CREATE TABLE invitations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    invited_by TEXT NOT NULL REFERENCES users(id),
    invited_phone TEXT,
    invited_email TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TEXT NOT NULL,
    accepted_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_invitations_chama ON invitations(chama_id);
CREATE INDEX idx_invitations_code ON invitations(invite_code);

CREATE TABLE join_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    chama_id TEXT NOT NULL REFERENCES chamas(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_join_requests_chama ON join_requests(chama_id);

