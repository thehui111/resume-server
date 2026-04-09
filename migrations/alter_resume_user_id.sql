-- 仅修改 resume 表 user_id 字段类型（从 BIGINT 迁移到 VARCHAR(32)）
-- 执行前请务必备份数据

-- 1. 添加临时列保存旧的整型 user_id
ALTER TABLE `resume` ADD COLUMN `user_id_old` BIGINT NULL;

-- 2. 将现有值备份到临时列
UPDATE `resume` SET `user_id_old` = `user_id`;

-- 3. 修改原 user_id 列为字符串类型
ALTER TABLE `resume` MODIFY COLUMN `user_id` VARCHAR(32) NOT NULL;

-- 4. 将旧的整型 id 映射为 user 表的业务 user_id（假设 user 表已有 user_id 字段）
UPDATE `resume` r
JOIN `user` u ON r.user_id_old = u.id
SET r.user_id = u.user_id;

-- 5. 删除临时列
ALTER TABLE `resume` DROP COLUMN `user_id_old`;
