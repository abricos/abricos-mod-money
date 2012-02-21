<?php
/**
 * @version $Id$
 * @package Abricos
 * @subpackage Money
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */

class MoneyQuery {

	/**
	 * Список категорий: свои + других участников, но только те, что используются
	 * в операциях
	 */
	public static function CategoryList(Ab_Database $db, $gids){
		if (count($gids) == 0){ return null; }
		
		$wh = array();
		foreach($gids as $gid){
			array_push($wh, "c.groupid=".intval($gid));
		}
		$sql = "
			SELECT 
				c.categoryid as id,
				c.parentcategoryid as pid,
				c.userid as uid,
				c.groupid as gid,
				c.title as tl,
				c.isexpense as ise,
				c.ord,
				c.upddate as upd
			FROM ".$db->prefix."money_category c
			WHERE ".implode(" OR ", $wh)."
		";
		return $db->query_read($sql);
	}
	
	public static function CategoryAppend(Ab_Database $db, $userid, $groupid, $title, $isExpense, $parentid = 0, $order = 0){
		$sql = "
			INSERT INTO ".$db->prefix."money_category 
			(parentcategoryid, userid, groupid, title, isexpense, ord, dateline, upddate) VALUES (
				".bkint($parentid).",
				".bkint($userid).",
				".bkint($groupid).",
				'".bkstr($title)."',
				".bkint($isExpense).",
				".bkint($order).",
				".TIMENOW.",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function UserListByIds(Ab_Database $db, $ids){
		$wh = array("u.userid=0");
		foreach($ids as $id){
			array_push($wh, "u.userid=".intval($id));
		}
		$sql = "
			SELECT
				u.userid as id,
				u.username as unm,
				u.firstname as fnm,
				u.lastname as lnm,
				u.avatar as avt 
			FROM ".$db->prefix."user u
			WHERE ".implode(" OR ", $wh)."
		";
		return $db->query_read($sql);
	}
	
	public static function GroupAppend(Ab_Database $db, $userid, $gd){
		$sql = "
			INSERT INTO ".$db->prefix."money_group (userid, title, dateline, upddate) VALUES (
				".bkint($userid).",
				'".bkstr($gd->tl)."',
				".TIMENOW.",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function GroupUpdate(Ab_Database $db, $groupid, $gd){
		$sql = "
			UPDATE ".$db->prefix."money_group
			SET title='".bkstr($gd->tl)."',
				upddate=".TIMENOW."
			WHERE groupid=".bkint($groupid)."
		";
		$db->query_write($sql);
	}
	
	public static function GroupRemove(Ab_Database $db, $groupid){
		$sql = "
			UPDATE ".$db->prefix."money_group
			SET upddate=".TIMENOW.", deldate=".TIMENOW."
			WHERE groupid=".bkint($groupid)."
		";
		$db->query_write($sql);
	}
	
	/**
	 * Получить список бухгалтерий по идентификатору.
	 * Проверка на принадлежность пользователя не проверяется, но добавляет роль 
	 * текущего пользователя в этой группе
	 * 
	 * @param Ab_Database $db
	 * @param mixed $ids
	 * @return NULL|integer
	 */
	public static function GroupListByIds(Ab_Database $db, $ids, $userid){
		if (!is_array($ids)){
			$ids = array(intval($ids));
		}
		if (count($ids) == 0){ return null; }
		$aw = array();
		foreach($ids as $id){
			array_push($aw, "g.groupid=".bkint($id));
		}
		$sql = "
			SELECT 
				g.groupid as id,
				g.userid as uid,
				g.title as tl,
				g.upddate as upd,
				IF ((ur.role IS NULL), 0, ur.role) as r
			FROM ".$db->prefix."money_group g
			LEFT JOIN ".$db->prefix."money_guserrole ur ON g.groupid=ur.groupid AND ur.userid=".bkint($userid)."
			WHERE ".implode($aw, " OR ")."
		";
		return $db->query_read($sql);
	}
	
	public static function GroupById(Ab_Database $db, $groupid, $userid){
		$rows = MoneyQuery::GroupListByIds($db, $groupid, $userid);
		return $db->fetch_array($rows);
	}

	public static function Account(Ab_Database $db, $userid, $accountid){
		$rows = MoneyQuery::AccountList($db, $userid, 0, $accountid);
		return $db->fetch_array($rows);
	}
	
	/**
	 * Список аккаунтов доступных пользователю
	 * 
	 * @param Ab_Database $db
	 * @param integer $userid
	 */
	public static function AccountList(Ab_Database $db, $userid, $groupid = 0, $accountid = 0){
		$sql = "
			SELECT 
				a.accountid as id,
				a.groupid as gid,
				a.title as tl,
				a.descript as dsc,
				a.accounttype as tp,
				a.initbalance as ibc,
				a.balance as bc,
				a.currency as cc,
				ur.role as r,
				a.upddate as upd
			FROM ".$db->prefix."money_auserrole ur
			INNER JOIN ".$db->prefix."money_account a ON a.accountid=ur.accountid
			INNER JOIN ".$db->prefix."money_group g ON g.groupid=a.groupid
			WHERE g.deldate=0 AND ur.userid=".bkint($userid)." AND ur.role>0  
				".($groupid>0?" AND a.groupid=".bkint($groupid):"")."
				".($accountid>0?" AND a.accountid=".bkint($accountid):"")."
		";
		if ($accountid > 0){
			$sql .= "
				LIMIT 1
			";
		}
		return $db->query_read($sql);
	}
	
	public static function AccountAppend(Ab_Database $db, $userid, $groupid, $ad){
		$sql = "
			INSERT INTO ".$db->prefix."money_account 
			(groupid, userid, accounttype, title, descript, initbalance, currency, dateline, upddate) VALUES (
				".bkint($groupid).",
				".bkint($userid).",
				".bkint($ad->tp).",
				'".bkstr($ad->tl)."',
				'".bkstr($ad->dsc)."',
				".doubleval($ad->ibc).",
				'".bkstr($ad->cc)."',
				".TIMENOW.",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function AccountUpdate(Ab_Database $db, $accountid, $ad){
		$sql = "
			UPDATE ".$db->prefix."money_account
			SET
				accounttype=".bkint($ad->tp).",
				title='".bkstr($ad->tl)."', 
				descript='".bkstr($ad->dsc)."',
				initbalance=".doubleval($ad->ibc).",
				currency='".bkstr($ad->cc)."',
				upddate=".TIMENOW."
			WHERE accountid=".bkint($accountid)."
		";
		$db->query_write($sql);
	}
	
	public static function AccountRemove(Ab_Database $db, $accountid){
		$sql = "
			UPDATE ".$db->prefix."money_account
			SET upddate=".TIMENOW.",
				deldate=".TIMENOW."
			WHERE accountid=".bkint($accountid)."
			LIMIT 1
		";
		$db->query_write($sql);
		return $db->affected_rows();
	}
	
	public static function AccountUpdateBalance(Ab_Database $db, $accountid){
		$row = MoneyQuery::OperSum($db, $accountid);
		$sm = empty($row) ? 0 : $row['sm'];
		$sql = "
			UPDATE ".$db->prefix."money_account
			SET balance = initbalance + ".bkint($sm)."
			WHERE accountid=".bkint($accountid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function OperSum(Ab_Database $db, $accountid){
		$sql = "
			SELECT sum(o.operval*if(o.isexpense=0, 1, -1)) as sm
			FROM ".$db->prefix."money_oper o
			WHERE o.accountid=".bkint($accountid)." AND o.deldate=0
			GROUP BY o.accountid
		";
		return $db->query_first($sql);
	}
	
	public static function GUserRoleListByGId(Ab_Database $db, $ids){
		$wh = array("ur.groupid=0");
		foreach($ids as $id){
			array_push($wh, "ur.groupid=".intval($id));
		}
		$sql = "
			SELECT
				concat(ur.groupid,'-',ur.userid) as id,
				ur.groupid as aid,
				ur.userid as u,
				ur.role as r
			FROM ".$db->prefix."money_guserrole ur
			WHERE ".implode(" OR ", $wh)."
		";
		return $db->query_read($sql);
	}
	
	public static function GUserRoleAppend(Ab_Database $db, $groupid, $userid, $role){
		$sql = "
			INSERT INTO ".$db->prefix."money_guserrole 
			(groupid, userid, role) VALUES (
				".bkint($groupid).",
				".bkint($userid).",
				".bkint($role)."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function GUserRoleUpdate(Ab_Database $db, $groupid, $userid, $role){
		$sql = "
			UPDATE ".$db->prefix."money_guserrole
			SET role=".bkint($role)."
			WHERE groupid=".bkint($groupid)." AND groupid=".bkint($userid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function GUserRoleRemove(Ab_Database $db, $groupid, $userid){
		$sql = "
			DELETE FROM ".$db->prefix."money_guserrole
			WHERE groupid=".bkint($groupid)." AND userid=".bkint($userid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}

	public static function AUserRoleListByAId(Ab_Database $db, $ids){
		$wh = array("ur.accountid=0");
		foreach($ids as $id){
			array_push($wh, "ur.accountid=".intval($id));
		}
		$sql = "
			SELECT
				concat(ur.accountid,'-',ur.userid) as id,
				ur.accountid as aid,
				ur.userid as u,
				ur.role as r
			FROM ".$db->prefix."money_auserrole ur
			WHERE ".implode(" OR ", $wh)."
		";
		return $db->query_read($sql);
	}
	
	public static function AUserRoleAppend(Ab_Database $db, $accountid, $userid, $role){
		$sql = "
			INSERT INTO ".$db->prefix."money_auserrole 
			(accountid, userid, role) VALUES (
				".bkint($accountid).",
				".bkint($userid).",
				".bkint($role)."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function AUserRoleUpdate(Ab_Database $db, $accountid, $userid, $role){
		$sql = "
			UPDATE ".$db->prefix."money_auserrole
			SET role=".bkint($role)."
			WHERE accountid=".bkint($accountid)." AND userid=".bkint($userid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function AUserRoleRemove(Ab_Database $db, $accountid, $userid){
		$sql = "
			DELETE FROM ".$db->prefix."money_auserrole
			WHERE accountid=".bkint($accountid)." AND userid=".bkint($userid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function OperAppend(Ab_Database $db, $userid, $accountid, $isExpense, $operval, $operdate, $catid, $descript, $methodid=0){
		$sql = "
			INSERT INTO ".$db->prefix."money_oper
			(methodid, accountid, userid, isexpense, operval, operdate, categoryid, descript, dateline, upddate) VALUES (
				".bkint($methodid).",
				".bkint($accountid).",
				".bkint($userid).",
				".bkint($isExpense).",
				".doubleval($operval).",
				".bkint($operdate).",
				".bkint($catid).",
				'".bkstr($descript)."',
				".TIMENOW.",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		return $db->insert_id();
	}
	
	public static function OperAppendByObj(Ab_Database $db, $userid, $accountid, $od){
		return MoneyQuery::OperAppend($db, $userid, $accountid, 
			$od->ise, $od->v, $od->d, $od->cid, $od->dsc);
	}
	
	public static function OperUpdate(Ab_Database $db, $operid, $accountid, $operval, $operdate, $catid, $descript){
		$sql = "
			UPDATE ".$db->prefix."money_oper
			SET
				operval=".doubleval($operval).",
				operdate=".bkint($operdate).",
				categoryid=".bkint($catid).",
				descript='".bkstr($descript)."',
				upddate=".TIMENOW."
			WHERE operid=".bkint($operid)." AND accountid=".bkint($accountid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function OperUpdateByObj(Ab_Database $db, $operid, $accountid, $od){
		return MoneyQuery::OperUpdate($db, $operid, $accountid, $od->v, $od->d, $od->cid, $od->dsc);
	}

	public static function OperRemove(Ab_Database $db, $operid, $accountid){
		$sql = "
			UPDATE ".$db->prefix."money_oper
			SET deldate=".TIMENOW.", upddate=".TIMENOW."
			WHERE operid=".bkint($operid)." AND accountid=".bkint($accountid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}
	
	public static function OperListByAIds(Ab_Database $db, $aids, $fromdt, $enddt, $lastUpdate = 0){
		$aw = array("o.accountid=0");
		foreach($aids as $id){
			array_push($aw, "o.accountid=".bkint($id));
		}
		$sql = "
			SELECT
				o.operid as id,
				o.accountid as aid,
				o.userid as uid,
				o.isexpense as ise,
				o.operval as v,
				o.operdate as d,
				o.categoryid as cid,
				o.descript as dsc,
				o.methodid as mid,
				o.upddate as upd
			FROM ".$db->prefix."money_oper o
			WHERE (o.operdate>=".bkint($fromdt)." AND o.operdate<=".bkint($enddt).") 
				AND (".implode($aw, " OR ").")
				".($lastUpdate>0?" AND o.upddate>".bkint($lastUpdate):"")."
				AND o.deldate=0
			LIMIT 300
		";
		return $db->query_read($sql);
	}
	
	public static function OperInfo(Ab_Database $db, $operid){
		$sql = "
			SELECT *
			FROM ".$db->prefix."money_oper o
			WHERE operid=".bkint($operid)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function OperMoveListByAIds(Ab_Database $db, $aids, $fromdt, $enddt, $lastUpdate=0){
		if (empty($aids)){ return null; }
		$aw = array();
		foreach($aids as $id){
			array_push($aw, "m.fromaccountid=".bkint($id)." OR m.toaccountid=".bkint($id));
		}
		$sql = "
			SELECT
				DISTINCT m.methodid as id,
				m.fromaccountid as faid,
				m.toaccountid as taid,
				m.operval as v,
				m.operdate as d
			FROM ".$db->prefix."money_move m
			INNER JOIN ".$db->prefix."money_oper o ON m.methodid=o.methodid 
			WHERE (o.operdate>=".bkint($fromdt)." AND o.operdate<=".bkint($enddt).") 
				AND (".implode($aw, " OR ").")
				".($lastUpdate>0?" AND o.upddate>".bkint($lastUpdate):"")."
				AND o.deldate=0
			LIMIT 300
		";
		return $db->query_read($sql);
	}
	
	public static function OperMoveAppend(Ab_Database $db, $userid, $od){
		
		$sql = "
			INSERT INTO ".$db->prefix."money_method
			(methodtype, userid, dateline, upddate) VALUES (
				'move',
				".bkint($userid).",
				".TIMENOW.",
				".TIMENOW."
			)
		";
		$db->query_write($sql);
		$methodid = $db->insert_id();
		
		// расход
		$fromOperId = MoneyQuery::OperAppend($db, $userid, $od->faid, true, $od->v, $od->d, 0, $od->dsc, $methodid);
		
		// доход
		$toOperId = MoneyQuery::OperAppend($db, $userid, $od->taid, false, $od->v, $od->d, 0, $od->dsc, $methodid);
		
		$sql = "
			INSERT INTO ".$db->prefix."money_move
			(methodid, fromaccountid, fromoperid, toaccountid, tooperid, operval, operdate) VALUES (
				".bkint($methodid).",
				".bkint($od->faid).",
				".bkint($fromOperId).",
				".bkint($od->taid).",
				".bkint($toOperId).",
		
				".doubleval($od->v).",
				".bkint($od->d)."
			)
		";
		$db->query_write($sql);
		
		return $methodid;
	}
	
	public static function OperMoveInfo(Ab_Database $db, $methodid){
		$sql = "
			SELECT *
			FROM ".$db->prefix."money_move 
			WHERE methodid=".bkint($methodid)."
			LIMIT 1
		";
		return $db->query_first($sql);
	}
	
	public static function OperMoveUpdate(Ab_Database $db, $methodid, $od){
		$sql = "
			UPDATE ".$db->prefix."money_move
			SET operval=".doubleval($od->v).",
				operdate=".bkint($od->d)."
			WHERE methodid=".bkint($methodid)." 
				AND fromaccountid=".bkint($od->faid)."
				AND toaccountid=".bkint($od->taid)."
		";
		$db->query_write($sql);
		
		$dbMOper = MoneyQuery::OperMoveInfo($db, $methodid);
		MoneyQuery::OperUpdate($db, $dbMOper['fromoperid'], $dbMOper['fromaccountid'], $od->v, $od->d, 0, $od->dsc);
		MoneyQuery::OperUpdate($db, $dbMOper['tooperid'], $dbMOper['toaccountid'], $od->v, $od->d, 0, $od->dsc);
	}
	
	public static function OperMoveRemove(Ab_Database $db, $methodid){
		$sql = "
			UPDATE ".$db->prefix."money_method
			SET deldate=".TIMENOW.", upddate=".TIMENOW."
			WHERE methodid=".bkint($methodid)." 
		";
		$db->query_write($sql);
		$dbMOper = MoneyQuery::OperMoveInfo($db, $methodid);
		MoneyQuery::OperRemove($db, $dbMOper['fromoperid'], $dbMOper['fromaccountid']);
		MoneyQuery::OperRemove($db, $dbMOper['tooperid'], $dbMOper['toaccountid']);
	}
	
}

?>