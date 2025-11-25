# daily_usage_history Tabelle - Spalten Analyse

## Basis Identifikation
- **`id`** (uuid) - Primärschlüssel, automatisch generiert
- **`user_id`** (uuid, nullable) - Referenz auf users Tabelle
- **`usage_date`** (date, NOT NULL) - Datum für tägliche Aggregation

## Kosten & Zähler
- **`cost_usd`** (numeric, default 0.0000) - Tageskosten in USD
- **`generations_count`** (integer, default 0) - Anzahl generierte Bilder pro Tag
- **`generation_time_seconds`** (integer, default 0) - Gesamte Generierungszeit pro Tag

## Resolution/Aspect Ratio Tracking
- **`count_2k_9_16`** (integer, default 0) - 2K Hochformat (Handy)
- **`count_2k_4_3`** (integer, default 0) - 2K Quadratisch/Quer
- **`count_4k_9_16`** (integer, default 0) - 4K Hochformat (Premium)
- **`count_4k_4_3`** (integer, default 0) - 4K Quadratisch/Quer

## API Usage Tracking
- **`prompt_tokens`** (integer, default 0) - Input Token Verbrauch
- **`output_tokens`** (integer, default 0) - Output Token Verbrauch
- **`errors_count`** (integer, default 0) - Anzahl Fehler/Failed Requests

## Analytics & Insights
- **`peak_usage_hour`** (integer, nullable) - Stunde mit meisten Generierungen (0-23)
- **`most_used_prompts`** (jsonb, nullable) - Top Prompts des Tages als JSON
- **`created_at`** (timestamp, default now()) - Erstellungszeitpunkt

---

**Zweck:** Tägliche Statistiken pro User für Dashboards, Billing und Analytics