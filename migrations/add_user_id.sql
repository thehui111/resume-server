-- 为已有表增加业务 user_id 并迁移简历关联字段
-- 执行前请务必备份数据

-- 1. user 表新增 user_id 字段
ALTER TABLE `user` ADD COLUMN `user_id` VARCHAR(32) NOT NULL UNIQUE AFTER `id`;

-- 2. 为已有用户生成 user_id（MySQL 示例）
-- 这里用 REPLACE(UUID(), '-', '') 生成 32 位 UUID
UPDATE `user` SET `user_id` = REPLACE(UUID(), '-', '');

-- 3. resume 表修改 user_id 字段类型（需要先清空或迁移数据）
-- 注意：如果 resume 表已有数据，下面的步骤会涉及数据迁移

-- 3.1 添加临时列存储旧的 int id 映射关系（可选，用于关联旧数据）
-- 这里假设 resume 表数据不多，直接通过子查询更新
ALTER TABLE `resume` MODIFY COLUMN `user_id` VARCHAR(32) NOT NULL;

-- 3.2 将 resume.user_id 从 user.id 更新为 user.user_id
UPDATE `resume` r
JOIN `user` u ON r.user_id = CAST(u.id AS CHAR)
SET r.user_id = u.user_id;

-- 4. ai_log 表同样修改（可选，如不需要可删除）
ALTER TABLE `ai_log` MODIFY COLUMN `user_id` VARCHAR(32) NOT NULL;
UPDATE `ai_log` l
JOIN `user` u ON l.user_id = CAST(u.id AS CHAR)
SET l.user_id = u.user_id;
