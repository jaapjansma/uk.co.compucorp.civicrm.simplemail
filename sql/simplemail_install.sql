SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `civicrm_simplemailheader`;
DROP TABLE IF EXISTS `civicrm_simplemailmessage`;

SET FOREIGN_KEY_CHECKS = 1;

-- /*******************************************************
-- *
-- * civicrm_simplemail_header
-- *
-- * Header images for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemailheader` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique Header ID',
  `label`      VARCHAR(30)  NOT NULL
  COMMENT 'Label for the header image',
  `image`      VARCHAR(255) NOT NULL
  COMMENT 'Header image',
  `show_logo`  TINYINT      NOT NULL  DEFAULT 1,
  `logo_image` VARCHAR(255) NULL
  COMMENT 'Logo image'
  ,
  PRIMARY KEY (`id`)
)
  ENGINE =InnoDB
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_unicode_ci;

-- /*******************************************************
-- *
-- * civicrm_simplemail_message
-- *
-- * Campaign messages for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemailmessage` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique Message ID',
  `label`     VARCHAR(30)  NOT NULL
  COMMENT 'Label for the message',
  `text`      TEXT         NOT NULL
  COMMENT 'Long text for the message',
  `is_active` TINYINT      NOT NULL  DEFAULT 1
  ,
  PRIMARY KEY (`id`)
)
  ENGINE =InnoDB
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_unicode_ci;
