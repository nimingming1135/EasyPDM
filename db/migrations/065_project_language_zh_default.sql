BEGIN;

-- 本 fork（nimingming1135/EasyPDM）面向中文用户：把简体中文加入“文档语言”列表，
-- 并设为默认文档语言（与 db/schema.sql 中“全新安装”的默认行为保持一致）。
-- 仅当 ZH 尚不存在时插入，避免重复；插入后把默认位让给 ZH，原默认 English 降为 false。
-- 约束 project_languages_one_default_idx 保证同一时刻只能有一个 is_default=true。

INSERT INTO project_languages (name, code, is_default)
VALUES ('Chinese (Simplified)', 'ZH', true)
ON CONFLICT (code) DO UPDATE SET is_default = true;

-- 若 ZH 已因冲突存在（ON CONFLICT 分支未触发插入），也确保它标记为默认：
UPDATE project_languages SET is_default = true WHERE code = 'ZH';

-- 其余语言（含原本的 English 默认）取消默认，确保全表只有一个默认。
UPDATE project_languages SET is_default = false WHERE code <> 'ZH';

COMMIT;
