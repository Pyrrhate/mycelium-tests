-- Points de Symbiose (PS) et résultat Constellation (état vibratoire) pour le TCG et la persistance.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS symbiose_points integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS constellation_result jsonb;

COMMENT ON COLUMN profiles.symbiose_points IS 'Points de Symbiose (PS) pour échanges, boutique et récompenses.';
COMMENT ON COLUMN profiles.constellation_result IS 'Dernier résultat du questionnaire Constellation (état vibratoire): { avgScores, summary, completedAt }.';
