-- 为 ai_log 表补充 input_tokens / output_tokens 列
-- 若已存在则会报 Duplicate column，可忽略或先检查：SHOW COLUMNS FROM ai_log;

ALTER TABLE `ai_log`
    ADD COLUMN `input_tokens`  INT NOT NULL DEFAULT 0 AFTER `action`,
    ADD COLUMN `output_tokens` INT NOT NULL DEFAULT 0 AFTER `input_tokens`;
