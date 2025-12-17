# Database Schema Definition (DDL)

## Overview
Database Name: `secure_chat`
Character Set: `utf8mb4` (Emoji Support)
Collation: `utf8mb4_unicode_ci` (Accurate Sorting)
Storage Engine: `InnoDB`

## SQL Script

```sql
CREATE DATABASE IF NOT EXISTS secure_chat DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE secure_chat;

-- ----------------------------
-- 1. Users Table (sys_user)
-- Stores user credentials, profile, and settings.
-- Optimization: Added status for account control.
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    `username` VARCHAR(64) NOT NULL COMMENT 'Login Account (Unique)',
    `password_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 Hash',
    `name` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'Display Name / Nickname',
    `avatar` VARCHAR(255) DEFAULT '' COMMENT 'Avatar URL',
    
    -- Personalization
    `sidebar_wallpaper` VARCHAR(255) DEFAULT '' COMMENT 'Sidebar Background URL',
    `chat_wallpaper` VARCHAR(255) DEFAULT '' COMMENT 'Chat Background URL',
    
    -- Status & Audit
    `status` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Status: 1-Normal, 0-Locked',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation Time',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update Time',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10000 DEFAULT CHARSET=utf8mb4 COMMENT='User Information';

-- ----------------------------
-- 2. Contacts Table (sys_contact)
-- Represents directional friendship. A<->B requires two records.
-- Optimization: Removed incorrect auto_increment, added remarks and status.
-- ----------------------------
DROP TABLE IF EXISTS `contacts`;
CREATE TABLE `contacts` (
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Owner User ID',
    `friend_id` BIGINT UNSIGNED NOT NULL COMMENT 'Friend User ID',
    `remark` VARCHAR(64) DEFAULT '' COMMENT 'Alias/Remark name for friend',
    `status` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Status: 1-Normal, 2-Blocked',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Friendship Established Time',
    
    PRIMARY KEY (`user_id`, `friend_id`),
    KEY `idx_friend_id` (`friend_id`),
    CONSTRAINT `fk_contact_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_contact_friend` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User Contacts';

-- ----------------------------
-- 3. Messages Table (sys_message)
-- Stores chat history.
-- Optimization: Added is_read, is_revoked.
-- Note: `created_at` uses BIGINT (ms) to align with frontend cursor pagination logic.
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Message ID',
    `sender_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sender User ID',
    `receiver_id` BIGINT UNSIGNED NOT NULL COMMENT 'Receiver User ID',
    
    `content` TEXT NOT NULL COMMENT 'Message Content (Text or URL)',
    `msg_type` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Type: 0-Text, 1-Image, 2-Sticker',
    
    -- Message Status
    `is_read` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Read Status: 0-Unread, 1-Read',
    `is_revoked` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Revoke Status: 0-Normal, 1-Revoked',
    
    -- Logic
    `created_at` BIGINT UNSIGNED NOT NULL COMMENT 'Timestamp (ms), Used for Cursor Pagination',
    
    PRIMARY KEY (`id`),
    KEY `idx_sender_receiver` (`sender_id`, `receiver_id`, `created_at`),
    KEY `idx_receiver_sender` (`receiver_id`, `sender_id`, `created_at`),
    CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_msg_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Chat Messages';

-- ----------------------------
-- 4. Stickers Table (sys_sticker)
-- Optimization: Added set_name for grouping.
-- ----------------------------
DROP TABLE IF EXISTS `stickers`;
CREATE TABLE `stickers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Sticker ID',
    `url` VARCHAR(255) NOT NULL COMMENT 'Sticker Image URL',
    `set_name` VARCHAR(50) DEFAULT 'default' COMMENT 'Sticker Collection Name',
    `sort_order` INT UNSIGNED DEFAULT 0 COMMENT 'Display Order',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sticker Library';

-- ----------------------------
-- 5. Files/Uploads Table (sys_file)
-- Tracks uploaded assets.
-- Optimization: Renamed to standard file table, added size/mime.
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'File ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Uploader ID',
    `file_url` VARCHAR(255) NOT NULL COMMENT 'Access URL',
    `file_path` VARCHAR(255) NOT NULL COMMENT 'Physical Storage Path (S3 Key/Local Path)',
    `original_name` VARCHAR(255) DEFAULT '' COMMENT 'Original Filename',
    `mime_type` VARCHAR(100) DEFAULT '' COMMENT 'MIME Type (e.g. image/png)',
    `file_size` BIGINT UNSIGNED DEFAULT 0 COMMENT 'Size in Bytes',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_user_upload` (`user_id`),
    CONSTRAINT `fk_file_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Uploaded Files Registry';
```

## Naming & Standards Convention
1.  **Keys**: `id` for Primary Key, `[table]_id` for Foreign Keys.
2.  **Types**: 
    *   IDs: `BIGINT UNSIGNED` (0 to 18,446,744,073,709,551,615).
    *   Status/Boolean: `TINYINT(1) UNSIGNED`.
3.  **Indexes**:
    *   `uk_` prefix for Unique Keys.
    *   `idx_` prefix for Normal Indexes.
    *   `fk_` prefix for Foreign Keys.
4.  **Engine**: Strict `InnoDB` for transaction support.
