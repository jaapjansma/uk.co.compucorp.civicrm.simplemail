SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `civicrm_simplemailheader`;
DROP TABLE IF EXISTS `civicrm_simplemailmessage`;
DROP TABLE IF EXISTS `civicrm_simplemail`;
DROP TABLE IF EXISTS `civicrm_simplemailrecipientgroup`;
DROP TABLE IF EXISTS `civicrm_simplemailheaderfilter`;

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
  `show_logo`  TINYINT,
  `logo_image` VARCHAR(255) COMMENT 'Logo image'
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


  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique SimpleMail ID',
  `crm_mailing_id`  INT UNSIGNED COMMENT 'The ID of CiviCRM mailing, once it has been generated from Simple Mail',
  `from_address`    VARCHAR(256) COMMENT 'Name and email address for the from field',
  `reply_address`   VARCHAR(256) COMMENT 'Email address for the reply to button',
  `header_id`       INT UNSIGNED COMMENT 'The ID of a mailing header',
  `title`           VARCHAR(64) COMMENT 'Title/strapline for the email (in the title region)',
  `body`            TEXT COMMENT 'Body of the email',
  `contact_details` TEXT COMMENT 'Contact details',
  `message_id`      INT UNSIGNED COMMENT 'The ID of the campaign message'
  ,
  PRIMARY KEY (`id`)


  ,
  CONSTRAINT FK_civicrm_simplemail_crm_mailing_id FOREIGN KEY (`crm_mailing_id`) REFERENCES `civicrm_mailing` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT FK_civicrm_simplemail_header_id FOREIGN KEY (`header_id`) REFERENCES `civicrm_simplemailheader` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT FK_civicrm_simplemail_message_id FOREIGN KEY (`message_id`) REFERENCES `civicrm_simplemailmessage` (`id`)
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

-- /*******************************************************
-- *
-- * civicrm_simplemailheaderfilter
-- *
-- * Filters for the headers in Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemailheaderfilter` (


  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Unique SimpleMailHeaderFilter ID',
  `header_id`    INT UNSIGNED NOT NULL
  COMMENT 'The ID of a header',
  `entity_table` VARCHAR(64) COMMENT 'Name of the table where item being referenced is stored',
  `entity_id`    INT UNSIGNED COMMENT 'Foreign key to the referenced item'
  ,
  PRIMARY KEY (`id`)


  , CONSTRAINT FK_civicrm_simplemailheaderfilter_header_id FOREIGN KEY (`header_id`) REFERENCES `civicrm_simplemailheader` (`id`)
  ON DELETE CASCADE
)
  ENGINE =InnoDB
  DEFAULT CHARACTER SET utf8
  COLLATE utf8_unicode_ci;
