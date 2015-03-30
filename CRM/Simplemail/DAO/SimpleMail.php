<?php
/*
+--------------------------------------------------------------------+
| CiviCRM version 4.6                                                |
+--------------------------------------------------------------------+
| Copyright CiviCRM LLC (c) 2004-2015                                |
+--------------------------------------------------------------------+
| This file is a part of CiviCRM.                                    |
|                                                                    |
| CiviCRM is free software; you can copy, modify, and distribute it  |
| under the terms of the GNU Affero General Public License           |
| Version 3, 19 November 2007 and the CiviCRM Licensing Exception.   |
|                                                                    |
| CiviCRM is distributed in the hope that it will be useful, but     |
| WITHOUT ANY WARRANTY; without even the implied warranty of         |
| MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.               |
| See the GNU Affero General Public License for more details.        |
|                                                                    |
| You should have received a copy of the GNU Affero General Public   |
| License and the CiviCRM Licensing Exception along                  |
| with this program; if not, contact CiviCRM LLC                     |
| at info[AT]civicrm[DOT]org. If you have questions about the        |
| GNU Affero General Public License or the licensing of CiviCRM,     |
| see the CiviCRM license FAQ at http://civicrm.org/licensing        |
+--------------------------------------------------------------------+
*/
/**
 * @package CRM
 * @copyright CiviCRM LLC (c) 2004-2015
 *
 * Generated from xml/schema/CRM/Simplemail/SimpleMail.xml
 * DO NOT EDIT.  Generated by CRM_Core_CodeGen
 */
require_once 'CRM/Core/DAO.php';
require_once 'CRM/Utils/Type.php';
class CRM_Simplemail_DAO_SimpleMail extends CRM_Core_DAO
{
  /**
   * static instance to hold the table name
   *
   * @var string
   */
  static $_tableName = 'civicrm_simplemail';
  /**
   * static instance to hold the field values
   *
   * @var array
   */
  static $_fields = null;
  /**
   * static instance to hold the keys used in $_fields for each field.
   *
   * @var array
   */
  static $_fieldKeys = null;
  /**
   * static instance to hold the FK relationships
   *
   * @var string
   */
  static $_links = null;
  /**
   * static instance to hold the values that can
   * be imported
   *
   * @var array
   */
  static $_import = null;
  /**
   * static instance to hold the values that can
   * be exported
   *
   * @var array
   */
  static $_export = null;
  /**
   * static value to see if we should log any modifications to
   * this table in the civicrm_log table
   *
   * @var boolean
   */
  static $_log = true;
  /**
   * Unique SimpleMail ID
   *
   * @var int unsigned
   */
  public $id;
  /**
   * The ID of CiviCRM mailing, once it has been generated from Simple Mail
   *
   * @var int unsigned
   */
  public $crm_mailing_id;
  /**
   * Name and email address for the from field
   *
   * @var string
   */
  public $from_address;
  /**
   * Email address for the reply to button
   *
   * @var string
   */
  public $reply_address;
  /**
   * The ID of a mailing header
   *
   * @var int unsigned
   */
  public $header_id;
  /**
   * Title/strapline for the email (in the title region)
   *
   * @var string
   */
  public $title;
  /**
   * Body of the email
   *
   * @var text
   */
  public $body;
  /**
   * Contact details
   *
   * @var text
   */
  public $contact_details;
  /**
   * The ID of the campaign message
   *
   * @var int unsigned
   */
  public $message_id;
  /**
   * class constructor
   *
   * @return civicrm_simplemail
   */
  function __construct()
  {
    $this->__table = 'civicrm_simplemail';
    parent::__construct();
  }
  /**
   * Returns foreign keys and entity references
   *
   * @return array
   *   [CRM_Core_Reference_Interface]
   */
  static function getReferenceColumns()
  {
    if (!self::$_links) {
      self::$_links = static ::createReferenceColumns(__CLASS__);
      self::$_links[] = new CRM_Core_Reference_Basic(self::getTableName() , 'crm_mailing_id', 'civicrm_mailing', 'id');
      self::$_links[] = new CRM_Core_Reference_Basic(self::getTableName() , 'header_id', 'civicrm_simplemailheader', 'id');
      self::$_links[] = new CRM_Core_Reference_Basic(self::getTableName() , 'message_id', 'civicrm_simplemailmessage', 'id');
    }
    return self::$_links;
  }
  /**
   * Returns all the column names of this table
   *
   * @return array
   */
  static function &fields()
  {
    if (!(self::$_fields)) {
      self::$_fields = array(
        'id' => array(
          'name' => 'id',
          'type' => CRM_Utils_Type::T_INT,
          'description' => 'Unique SimpleMail ID',
          'required' => true,
        ) ,
        'crm_mailing_id' => array(
          'name' => 'crm_mailing_id',
          'type' => CRM_Utils_Type::T_INT,
          'description' => 'The ID of CiviCRM mailing, once it has been generated from Simple Mail',
          'FKClassName' => 'CRM_Mailing_DAO_Mailing',
        ) ,
        'from_address' => array(
          'name' => 'from_address',
          'type' => CRM_Utils_Type::T_STRING,
          'title' => ts('From Address') ,
          'description' => 'Name and email address for the from field',
          'maxlength' => 256,
          'size' => CRM_Utils_Type::HUGE,
          'html' => array(
            'type' => 'Text',
          ) ,
        ) ,
        'reply_address' => array(
          'name' => 'reply_address',
          'type' => CRM_Utils_Type::T_STRING,
          'title' => ts('Reply Address') ,
          'description' => 'Email address for the reply to button',
          'maxlength' => 256,
          'size' => CRM_Utils_Type::HUGE,
          'html' => array(
            'type' => 'Text',
          ) ,
        ) ,
        'header_id' => array(
          'name' => 'header_id',
          'type' => CRM_Utils_Type::T_INT,
          'description' => 'The ID of a mailing header',
          'FKClassName' => 'CRM_Simplemail_DAO_SimpleMailHeader',
        ) ,
        'title' => array(
          'name' => 'title',
          'type' => CRM_Utils_Type::T_STRING,
          'title' => ts('Title') ,
          'description' => 'Title/strapline for the email (in the title region)',
          'maxlength' => 64,
          'size' => CRM_Utils_Type::BIG,
        ) ,
        'body' => array(
          'name' => 'body',
          'type' => CRM_Utils_Type::T_TEXT,
          'title' => ts('Body') ,
          'description' => 'Body of the email',
        ) ,
        'contact_details' => array(
          'name' => 'contact_details',
          'type' => CRM_Utils_Type::T_TEXT,
          'title' => ts('Contact Details') ,
          'description' => 'Contact details',
        ) ,
        'message_id' => array(
          'name' => 'message_id',
          'type' => CRM_Utils_Type::T_INT,
          'description' => 'The ID of the campaign message',
          'FKClassName' => 'CRM_Simplemail_DAO_SimpleMailMessage',
        ) ,
      );
    }
    return self::$_fields;
  }
  /**
   * Returns an array containing, for each field, the arary key used for that
   * field in self::$_fields.
   *
   * @return array
   */
  static function &fieldKeys()
  {
    if (!(self::$_fieldKeys)) {
      self::$_fieldKeys = array(
        'id' => 'id',
        'crm_mailing_id' => 'crm_mailing_id',
        'from_address' => 'from_address',
        'reply_address' => 'reply_address',
        'header_id' => 'header_id',
        'title' => 'title',
        'body' => 'body',
        'contact_details' => 'contact_details',
        'message_id' => 'message_id',
      );
    }
    return self::$_fieldKeys;
  }
  /**
   * Returns the names of this table
   *
   * @return string
   */
  static function getTableName()
  {
    return self::$_tableName;
  }
  /**
   * Returns if this table needs to be logged
   *
   * @return boolean
   */
  function getLog()
  {
    return self::$_log;
  }
  /**
   * Returns the list of fields that can be imported
   *
   * @param bool $prefix
   *
   * @return array
   */
  static function &import($prefix = false)
  {
    if (!(self::$_import)) {
      self::$_import = array();
      $fields = self::fields();
      foreach($fields as $name => $field) {
        if (CRM_Utils_Array::value('import', $field)) {
          if ($prefix) {
            self::$_import['simplemail'] = & $fields[$name];
          } else {
            self::$_import[$name] = & $fields[$name];
          }
        }
      }
    }
    return self::$_import;
  }
  /**
   * Returns the list of fields that can be exported
   *
   * @param bool $prefix
   *
   * @return array
   */
  static function &export($prefix = false)
  {
    if (!(self::$_export)) {
      self::$_export = array();
      $fields = self::fields();
      foreach($fields as $name => $field) {
        if (CRM_Utils_Array::value('export', $field)) {
          if ($prefix) {
            self::$_export['simplemail'] = & $fields[$name];
          } else {
            self::$_export[$name] = & $fields[$name];
          }
        }
      }
    }
    return self::$_export;
  }
}
