-- 新增 Classic 经典模板记录（html_template 为 NULL，由应用层读取 classic.html 文件）
INSERT INTO `resume_template` (`name`, `thumbnail_url`, `html_template`, `is_premium`, `created_at`)
VALUES ('Classic 经典', NULL, NULL, 0, NOW())
ON DUPLICATE KEY UPDATE `name` = `name`;
