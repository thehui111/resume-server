-- 简历生成网站初始化建表脚本
-- 执行前请确保数据库已创建: CREATE DATABASE resume_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `user_id`       VARCHAR(32)  NOT NULL,
    `email`         VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name`          VARCHAR(100) NOT NULL,
    `created_at`    DATETIME     NOT NULL,
    `updated_at`    DATETIME     NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_email` (`email`),
    UNIQUE KEY `uk_user_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `resume_template` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `name`          VARCHAR(100) NOT NULL,
    `thumbnail_url` VARCHAR(512) DEFAULT NULL,
    `html_template` TEXT,
    `is_premium`    TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at`    DATETIME     NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `resume` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `user_id`     VARCHAR(32)  NOT NULL,
    `title`       VARCHAR(255) NOT NULL DEFAULT '未命名简历',
    `template_id` BIGINT       DEFAULT NULL,
    `status`      VARCHAR(20)  NOT NULL DEFAULT 'draft',
    `target_role` VARCHAR(200) DEFAULT NULL,
    `created_at`  DATETIME     NOT NULL,
    `updated_at`  DATETIME     NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_resume_user_id` (`user_id`),
    KEY `idx_resume_template_id` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `resume_section` (
    `id`           BIGINT      NOT NULL AUTO_INCREMENT,
    `resume_id`    BIGINT      NOT NULL,
    `section_type` VARCHAR(50) NOT NULL,
    `content`      TEXT,
    `order_index`  INT         NOT NULL DEFAULT 0,
    `created_at`   DATETIME    NOT NULL,
    `updated_at`   DATETIME    NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_resume_section_resume_id` (`resume_id`),
    KEY `idx_resume_section_type` (`resume_id`, `section_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `ai_log` (
    `id`            BIGINT      NOT NULL AUTO_INCREMENT,
    `user_id`       VARCHAR(32) NOT NULL,
    `resume_id`     BIGINT      DEFAULT NULL,
    `action`        VARCHAR(50) NOT NULL,
    `input_tokens`  INT         NOT NULL DEFAULT 0,
    `output_tokens` INT         NOT NULL DEFAULT 0,
    `created_at`    DATETIME    NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_ai_log_user_id` (`user_id`),
    KEY `idx_ai_log_resume_id` (`resume_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 内置一个默认模板（html_template 由应用层文件读取，此处留空）
INSERT INTO `resume_template` (`name`, `is_premium`, `created_at`)
VALUES ('默认模板', 0, NOW())
ON DUPLICATE KEY UPDATE `name` = `name`;
