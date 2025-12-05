-- ⚠️ WICHTIG: DIESE HASHES SIND TEMPORÄR! 
-- Das Login System nutzt bcrypt, diese Accounts funktionieren noch NICHT!
-- Du musst die bcrypt Hashes in Supabase generieren lassen.

-- LÖSUNG: Gehe zu Supabase Dashboard und nutze diese SQL-Funktion:

-- Erstelle bcrypt Hash-Funktion in Supabase:
CREATE OR REPLACE FUNCTION create_alpha_user(p_username TEXT, p_password TEXT) 
RETURNS void AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- Generate bcrypt hash (Supabase has crypt extension)
  SELECT crypt(p_password, gen_salt('bf', 12)) INTO v_hash;
  
  INSERT INTO users (username, password_hash, gemini_api_key, default_resolution, default_aspect_ratio) 
  VALUES (p_username, v_hash, '', '2K', '9:16');
END;
$$ LANGUAGE plpgsql;

-- Dann führe diese Commands aus:
SELECT create_alpha_user('emilia.berlin', '1611');
SELECT create_alpha_user('jessy.germany', '2018'); 
SELECT create_alpha_user('tyra.foxi', '2018');
SELECT create_alpha_user('selena.luna', '2025');

-- Verify:
SELECT username, created_at FROM users WHERE username IN ('emilia.berlin', 'jessy.germany', 'tyra.foxi', 'selena.luna');