<?php
/**
 * Схема таблиц данного модуля.
 *
 * @version $Id$
 * @package Abricos
 * @subpackage Money
 * @copyright Copyright (C) 2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author  Alexander Kuzmin (roosit@abricos.org)
 */

$charset = "CHARACTER SET 'utf8' COLLATE 'utf8_general_ci'";
$updateManager = Ab_UpdateManager::$current;
$db = Abricos::$db;
$pfx = $db->prefix;

if ($updateManager->isInstall()) {

    Abricos::GetModule('money')->permission->Install();

    // Бухгалтерия
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_group (
		  groupid int(10) unsigned NOT NULL auto_increment COMMENT 'Идентификатор счета',
		  userid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор автора',
		  title varchar(250) NOT NULL DEFAULT '' COMMENT 'Название',
		  
		  dateline int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата создания',
		  deldate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
		  upddate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата обновления',
		  
		  PRIMARY KEY  (groupid)
		)".$charset);

    // Доступ пользователей на управление в бухгалтерии
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_guserrole (
		  groupid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор бухгалтерии',
		  userid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор пользователя',
		  
		  role tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT 'Роль пользователя: 0-нет доступа, 1-только для чтения, 2-запись, 3-админ',

		  deldate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
		  UNIQUE KEY `group` (groupid, userid)
		)".$charset);


    // TODO: возможно необходимо прикреплять аккаунт к нескольким группам?
    // Кошелек
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_account (
		  accountid int(10) unsigned NOT NULL auto_increment COMMENT 'Идентификатор счета',
		  groupid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор бухгалтерии',
		  userid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор автора',

		  accounttype tinyint(2) unsigned NOT NULL DEFAULT 1 COMMENT 'Тип счета',
		  title varchar(250) NOT NULL DEFAULT '' COMMENT 'Название',
		  descript TEXT COMMENT 'Примечание',
	
		  initbalance double(10, 2) NOT NULL DEFAULT 0 COMMENT 'Начальный баланс',
		  balance double(10, 2) NOT NULL DEFAULT 0 COMMENT 'Текущий баланс',
		  currency varchar(3) NOT NULL DEFAULT '' COMMENT 'Идентификатор валюты',
	
		  dateline int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата создания',
		  upddate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата обновления',
		  deldate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
	
		  PRIMARY KEY  (accountid),
		  KEY groupid (groupid),
		  KEY userid (userid)
		)".$charset);

    // Доступ пользователей к счету
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_auserrole (
		  accountid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор счета',
		  userid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор пользователя',
		  
		  role tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT 'Роль пользователя: 0-нет доступа, 1-только для чтения, 2-запись, 3-админ',

		  deldate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
		  UNIQUE KEY account (accountid, userid)
		)".$charset);

    // Метод ввода операции, заложено на будущее, для оптимизации
    // расширенных возможностей ввода операций
    // TODO: в данной версии реализован только один метод - перемещение
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_method (
		  methodid int(10) unsigned NOT NULL auto_increment COMMENT 'Идентификатор',
		  methodtype varchar(10) NOT NULL DEFAULT '' COMMENT 'Тип метода, например move - перемещение',
		  userid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Автор операции',

		  dateline int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата создания',
		  upddate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата обновления',
		  deldate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
	
		  PRIMARY KEY  (methodid),
		  KEY methodtype (methodtype)
		)".$charset);

    // Перемещения денежных сердств по счетам
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_move (
		  methodid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор',
	
		  fromaccountid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Источник счета',
		  fromoperid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Операция - источник',

		  toaccountid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Счет назначение',
		  tooperid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Операция - назначение',
	
		  operval double(10, 2) unsigned NOT NULL DEFAULT 0 COMMENT 'Сумма операции',
		  operdate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата операции',
	
		  cmaccount int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Счет списания комиссии',
		  cmoperid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Операция - комиссия',
		  cmval double(10, 2) unsigned NOT NULL DEFAULT 0 COMMENT 'Сумма комиссии',
		  cmispercent tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '0-абсолютное значение, 1-процент',
	
		  PRIMARY KEY  (methodid)	
		)".$charset);

    // Операции по счету
    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_oper (
		  operid int(10) unsigned NOT NULL auto_increment COMMENT 'Идентификатор',
		  methodid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор метода ввода операции, 0-не определен',
		  accountid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор счета',
		  userid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор пользователя операции',

		  isexpense tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '0 - приход, 1 - расход',
		  operval double(10, 2) unsigned NOT NULL DEFAULT 0 COMMENT 'Сумма операции',
		  operdate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата операции',
	
		  categoryid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Категория',
		  descript TEXT COMMENT 'Примечание',
		  tags TEXT COMMENT 'Теги',

		  dateline int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата создания',
		  upddate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата обновления',
		  deldate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
	
		  PRIMARY KEY  (operid),
		  KEY accountid (accountid)	
		)".$charset);

    $db->query_write("
		CREATE TABLE IF NOT EXISTS ".$pfx."money_category (
		  categoryid int(10) unsigned NOT NULL auto_increment COMMENT 'Идентификатор',
		  parentcategoryid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Родитель',
		  userid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор пользователя',
		  groupid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Идентификатор бухгалтерии',
	
		  title varchar(250) NOT NULL DEFAULT '' COMMENT 'Название',
		  
		  isexpense tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '0 - приход, 1 - расход',

		  ord int(2) unsigned NOT NULL DEFAULT 0 COMMENT 'Сортировка',
	
		  dateline int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата создания',
		  upddate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата обновления',
		  deldate int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Дата удаления',
	
		  PRIMARY KEY  (categoryid),
		  KEY userid (userid),
		  KEY groupid (groupid)
		)".$charset);
}

if (!$updateManager->isInstall() && $updateManager->isUpdate('0.1.0.1')) {

    $db->query_write("
		ALTER TABLE ".$pfx."money_move
			ADD fromoperid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Операция - источник',
			ADD tooperid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Операция - назначение',
			ADD cmoperid int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Операция - комиссия'
	");

    $rows = $db->query_read("
		SELECT *
		FROM ".$pfx."money_move
	");
    while (($row = $db->fetch_array($rows))) {
        $oper = $db->query_first("
			SELECT *
			FROM ".$pfx."money_oper
			WHERE methodid=".$row['methodid']." and accountid=".$row['fromaccountid']."
		");
        $db->query_write("
			UPDATE ".$pfx."money_move
			SET fromoperid=".$oper['operid']."
			WHERE methodid=".$row['methodid']."
			LIMIT 1
		");

        $oper = $db->query_first("
			SELECT *
			FROM ".$pfx."money_oper
			WHERE methodid=".$row['methodid']." and accountid=".$row['toaccountid']."
		");
        $db->query_write("
			UPDATE ".$pfx."money_move
			SET tooperid=".$oper['operid']."
			WHERE methodid=".$row['methodid']."
			LIMIT 1
		");
    }
}

if (!$updateManager->isInstall() && $updateManager->isUpdate('0.2.1.1')){
	$db->query_write("
		ALTER TABLE ".$pfx."money_oper
		ADD tags TEXT COMMENT 'Теги'
	");
}

?>