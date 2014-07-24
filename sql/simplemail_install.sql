SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `civicrm_simplemailheader`;
DROP TABLE IF EXISTS `civicrm_simplemailmessage`;
DROP TABLE IF EXISTS `civicrm_simplemail`;

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

-- /*******************************************************
-- *
-- * civicrm_simplemail
-- *
-- * Campaign details for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemail` (
  `id`               INT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Unique SimpleMail ID',
  `name`             VARCHAR(50)      NOT NULL
  COMMENT 'Name of the mailing campaign',
  `resume_step`      TINYINT UNSIGNED NOT NULL  DEFAULT 1
  COMMENT 'The step to resume from on the wizard',
  `header_id`        INT UNSIGNED     NULL
  COMMENT 'The ID of a mailing header',
  `subject`          VARCHAR(50)      NOT NULL
  COMMENT 'Subject of the email',
  `title`            VARCHAR(50)      NOT NULL
  COMMENT 'Title/strapline for the email (in the title region)',
  `body`             TEXT             NOT NULL
  COMMENT 'Body of the email',
  `message_id`       INT UNSIGNED     NULL
  COMMENT 'The ID of the campaign message',
  `send_immediately` TINYINT          NOT NULL  DEFAULT 0,
  `send_on`          DATETIME         NULL
  COMMENT 'Date scheduled for sending emails'
  ,
  PRIMARY KEY (`id`)

  , CONSTRAINT FK_civicrm_simplemail_header_id FOREIGN KEY (`header_id`) REFERENCES `civicrm_simplemailheader` (`id`)
  ON DELETE SET NULL, CONSTRAINT FK_civicrm_simplemail_message_id FOREIGN KEY (`message_id`) REFERENCES `civicrm_simplemailmessage` (`id`)
  ON DELETE SET NULL
)
  ENGINE =InnoDB
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_unicode_ci;
