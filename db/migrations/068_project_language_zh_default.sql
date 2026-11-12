BEGIN;

-- 本 fork（nimingming1135/EasyPDM）面向中文用户：把简体中文加入“文档语言”列表，
-- 并设为默认文档语言（与 db/schema.sql 中“全新安装”的默认行为保持一致）。
--
-- KOLEJNOŚĆ JEST ISTOTNA: projekt_languages_one_default_idx to CZĘŚCIOWY indeks unikalny
-- (WHERE is_default), więc w tabeli może istnieć tylko JEDEN wiersz z is_default = true.
-- W bazie z migracji 063 domyślnym jest już English (EN), więc wstawienie ZH od razu
-- z is_default = true naruszyłoby ten indeks i wywaliło CAŁY start programu (MigrationRunner
-- przerywa działanie, gdy migracja się nie powiedzie). Dlatego najpierw zwalniamy flagę
-- domyślności, a dopiero potem wstawiamy/przestawiamy ZH.
UPDATE project_languages SET is_default = false WHERE code <> 'ZH';

INSERT INTO project_languages (name, code, is_default)
VALUES ('Chinese (Simplified)', 'ZH', true)
ON CONFLICT (code) DO UPDATE SET is_default = true;

-- Gdyby ZH już istniało (ON CONFLICT), upewniamy się, że jest domyślne.
UPDATE project_languages SET is_default = true WHERE code = 'ZH';

COMMIT;
