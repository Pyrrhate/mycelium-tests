-- Combat (match_history) et Journal (user_journal) pour TCG et Coaching.
-- match_history : issue des duels pour PS/XP et classements.
CREATE TABLE IF NOT EXISTS match_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_type text NOT NULL DEFAULT 'ai', -- 'ai' | 'parasite' | 'player'
  opponent_id text,
  result text NOT NULL, -- 'win' | 'loss' | 'draw' | 'fusion'
  player_hp_final integer,
  opponent_hp_final integer,
  turns_played integer DEFAULT 0,
  rewards_ps integer DEFAULT 0,
  rewards_xp integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_history_user_id ON match_history(user_id);
CREATE INDEX IF NOT EXISTS idx_match_history_created_at ON match_history(created_at DESC);

COMMENT ON TABLE match_history IS 'Historique des duels (IA, Parasite, PvP) pour récompenses PS/XP.';

-- user_journal : entrées du Journal de Sève (Sanctuaire).
CREATE TABLE IF NOT EXISTS user_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_text text NOT NULL,
  detected_element text,
  assigned_quest_id text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_journal_user_id ON user_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journal_created_at ON user_journal(created_at DESC);

COMMENT ON TABLE user_journal IS 'Journal alchimique : texte, élément détecté, quête assignée, validation.';

-- RLS (à adapter selon votre politique)
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own match_history" ON match_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own match_history" ON match_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own user_journal" ON user_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_journal" ON user_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_journal" ON user_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_journal" ON user_journal FOR DELETE USING (auth.uid() = user_id);
