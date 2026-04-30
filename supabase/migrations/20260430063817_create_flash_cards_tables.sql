/*
  # Create flash cards tables

  1. New Tables
    - `flash_cards`
      - `id` (uuid, primary key)
      - `japanese` (text, Japanese word/kanji)
      - `reading` (text, hiragana/katakana reading)
      - `english` (text, English translation)
      - `category` (text, category like "greetings", "numbers", etc.)
      - `difficulty` (text, 'beginner' | 'intermediate' | 'advanced')
      - `created_at` (timestamptz)
    - `study_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `cards_studied` (integer)
      - `correct` (integer)
      - `incorrect` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - flash_cards: readable by all authenticated users, insertable only by service role
    - study_sessions: users can only read/write their own sessions

  3. Seed Data
    - 30 beginner Japanese flash cards across categories
*/

CREATE TABLE IF NOT EXISTS flash_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  japanese text NOT NULL,
  reading text NOT NULL,
  english text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'beginner',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flash_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read flash cards"
  ON flash_cards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert flash cards"
  ON flash_cards FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cards_studied integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  incorrect integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seed data: beginner Japanese flash cards
INSERT INTO flash_cards (japanese, reading, english, category, difficulty) VALUES
  -- Greetings
  ('こんにちは', 'こんにちは', 'Hello', 'greetings', 'beginner'),
  ('おはよう', 'おはよう', 'Good morning', 'greetings', 'beginner'),
  ('こんばんは', 'こんばんは', 'Good evening', 'greetings', 'beginner'),
  ('さようなら', 'さようなら', 'Goodbye', 'greetings', 'beginner'),
  ('ありがとう', 'ありがとう', 'Thank you', 'greetings', 'beginner'),
  ('すみません', 'すみません', 'Excuse me / Sorry', 'greetings', 'beginner'),
  ('はい', 'はい', 'Yes', 'greetings', 'beginner'),
  ('いいえ', 'いいえ', 'No', 'greetings', 'beginner'),
  -- Numbers
  ('一', 'いち', 'One', 'numbers', 'beginner'),
  ('二', 'に', 'Two', 'numbers', 'beginner'),
  ('三', 'さん', 'Three', 'numbers', 'beginner'),
  ('四', 'し/よん', 'Four', 'numbers', 'beginner'),
  ('五', 'ご', 'Five', 'numbers', 'beginner'),
  ('六', 'ろく', 'Six', 'numbers', 'beginner'),
  ('七', 'しち/なな', 'Seven', 'numbers', 'beginner'),
  ('八', 'はち', 'Eight', 'numbers', 'beginner'),
  ('九', 'きゅう/く', 'Nine', 'numbers', 'beginner'),
  ('十', 'じゅう', 'Ten', 'numbers', 'beginner'),
  -- Common words
  ('水', 'みず', 'Water', 'common', 'beginner'),
  ('食べ物', 'たべもの', 'Food', 'common', 'beginner'),
  ('大丈夫', 'だいじょうぶ', 'OK / Alright', 'common', 'beginner'),
  ('先生', 'せんせい', 'Teacher', 'common', 'beginner'),
  ('学生', 'がくせい', 'Student', 'common', 'beginner'),
  ('友達', 'ともだち', 'Friend', 'common', 'beginner'),
  ('家族', 'かぞく', 'Family', 'common', 'beginner'),
  -- Time
  ('今日', 'きょう', 'Today', 'time', 'beginner'),
  ('明日', 'あした', 'Tomorrow', 'time', 'beginner'),
  ('昨日', 'きのう', 'Yesterday', 'time', 'beginner'),
  ('朝', 'あさ', 'Morning', 'time', 'beginner'),
  ('夜', 'よる', 'Night', 'time', 'beginner'),
  ('今', 'いま', 'Now', 'time', 'beginner');
