SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `civicrm_simplemailheader`;
DROP TABLE IF EXISTS `civicrm_simplemailmessage`;
DROP TABLE IF EXISTS `civicrm_simplemail`;
DROP TABLE IF EXISTS `civicrm_simplemailrecipientgroup`;

SET FOREIGN_KEY_CHECKS = 1;

-- /*******************************************************
-- *
-- * civicrm_simplemailheader
-- *
-- * Header for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemailheader` (


  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique Header ID',
  `label`      VARCHAR(64)  NOT NULL
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
-- * civicrm_simplemailmessage
-- *
-- * Message for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemailmessage` (


  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique Message ID',
  `label`     VARCHAR(64)  NOT NULL
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
-- * Mailing details for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemail` (


  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique SimpleMail ID',
  `name`             VARCHAR(64) COMMENT 'Name of the mailing',
  `resume_step`      INT UNSIGNED DEFAULT 1
  COMMENT 'The step to resume from on the wizard',
  `from_name`        VARCHAR(128) COMMENT 'Name for the from email address',
  `from_email`       VARCHAR(128) COMMENT 'Email for the from email address',
  `header_id`        INT UNSIGNED COMMENT 'The ID of a mailing header',
  `subject`          VARCHAR(64) COMMENT 'Subject of the email',
  `title`            VARCHAR(64) COMMENT 'Title/strapline for the email (in the title region)',
  `body`             TEXT COMMENT 'Body of the email',
  `contact_details`  TEXT COMMENT 'Contact details',
  `message_id`       INT UNSIGNED COMMENT 'The ID of the campaign message',
  `send_immediately` TINYINT DEFAULT 0,
  `send_on`          DATETIME COMMENT 'Date scheduled for sending emails'
  ,
  PRIMARY KEY (`id`)


  , CONSTRAINT FK_civicrm_simplemail_header_id FOREIGN KEY (`header_id`) REFERENCES `civicrm_simplemailheader` (`id`)
  ON DELETE SET NULL, CONSTRAINT FK_civicrm_simplemail_message_id FOREIGN KEY (`message_id`) REFERENCES `civicrm_simplemailmessage` (`id`)
  ON DELETE SET NULL
)
  ENGINE =InnoDB
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_unicode_ci;

-- /*******************************************************
-- *
-- * civicrm_simplemailrecipientgroup
-- *
-- * Recipient group for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemailrecipientgroup` (


  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique SimpleMailRecipientGroup ID',
  `mailing_id`   INT UNSIGNED COMMENT 'The ID of a mailing',
  `group_type`   VARCHAR(8) COMMENT 'Are the members of the group included or excluded?',
  `entity_table` VARCHAR(64) COMMENT 'Name of the table where item being referenced is stored',
  `entity_id`    INT UNSIGNED COMMENT 'Foreign key to the referenced item'
  ,
  PRIMARY KEY (`id`)


  , CONSTRAINT FK_civicrm_simplemailrecipientgroup_mailing_id FOREIGN KEY (`mailing_id`) REFERENCES `civicrm_simplemail` (`id`)
  ON DELETE CASCADE
)
  ENGINE =InnoDB
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_unicode_ci;
