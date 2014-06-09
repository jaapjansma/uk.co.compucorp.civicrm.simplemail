SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `civicrm_simplemail_message`;

SET FOREIGN_KEY_CHECKS=1;

-- /*******************************************************
-- *
-- * civicrm_simplemail_message
-- *
-- * Campaign messages for Simple Mail
-- *
-- *******************************************************/
CREATE TABLE `civicrm_simplemail_message` (

     `id` int unsigned NOT NULL AUTO_INCREMENT  COMMENT 'Unique message ID',
     `label` varchar(255) NOT NULL   COMMENT 'Message label',
     `is_active` tinyint NOT NULL  DEFAULT 0
,
    PRIMARY KEY ( `id` )

)  ENGINE=InnoDB DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci  ;