<?php
/**
 * @package Abricos
 * @subpackage Money
 * @copyright 2011-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

/**
 * Class MoneyQuery
 */
class MoneyQuery {

    /**
     * Список категорий: свои + других участников, но только те, что используются
     * в операциях
     */
    public static function CategoryList(Ab_Database $db, $gids){
        if (count($gids) == 0){
            return null;
        }

        $wh = array();
        foreach ($gids as $gid){
            array_push($wh, "c.groupid=".intval($gid));
        }
        $sql = "
			SELECT 
				c.categoryid as id,
				c.parentcategoryid as parentid,
				c.userid,
				c.groupid,
				c.title,
				c.isexpense,
				c.ord,
				c.upddate
			FROM ".$db->prefix."money_category c
			WHERE (".implode(" OR ", $wh).") AND c.deldate=0
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

    public static function CategoryUpdate(Ab_Database $db, $groupid, $categoryid, $title){
        $sql = "
			UPDATE ".$db->prefix."money_category
			SET title='".bkstr($title)."',
			    upddate=".TIMENOW."
			WHERE groupid=".bkint($groupid)." AND categoryid=".bkint($categoryid)."
			LIMIT 1
		";
        $db->query_write($sql);
    }

    public static function CategoryRemove(Ab_Database $db, $groupid, $categoryid){
        $sql = "
			UPDATE ".$db->prefix."money_category
			SET deldate=".TIMENOW.",
			    upddate=".TIMENOW."
			WHERE groupid=".bkint($groupid)." AND categoryid=".bkint($categoryid)."
			LIMIT 1
		";
        $db->query_write($sql);
    }

    public static function UserListByIds(Ab_Database $db, $ids){
        $wh = array("u.userid=".Abricos::$user->id);
        foreach ($ids as $id){
            array_push($wh, "u.userid=".intval($id));
        }
        $sql = "
			SELECT
				u.userid as id,
				u.username,
				u.firstname,
				u.lastname,
				u.avatar
			FROM ".$db->prefix."user u
			WHERE ".implode(" OR ", $wh)."
		";
        return $db->query_read($sql);
    }

    public static function GroupAppend(Ab_Database $db, $userid, $d){
        $sql = "
			INSERT INTO ".$db->prefix."money_group (userid, title, dateline, upddate) VALUES (
				".bkint($userid).",
				'".bkstr($d->title)."',
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
			SET title='".bkstr($gd->title)."',
				upddate=".TIMENOW."
			WHERE groupid=".bkint($groupid)."
		";
        $db->query_write($sql);
    }

    public static function GroupRemove(Ab_Database $db, $groupid){
        $sql = "
			UPDATE ".$db->prefix."money_group
			SET upddate=".TIMENOW.",
			    deldate=".TIMENOW."
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
        if (count($ids) == 0){
            return null;
        }
        $aw = array();
        foreach ($ids as $id){
            array_push($aw, "g.groupid=".bkint($id));
        }
        $sql = "
			SELECT 
				g.groupid as id,
				g.userid,
				g.title,
				g.upddate,
				IF ((ur.role IS NULL), 0, ur.role) as role
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
			SELECT a.accountid as id,
				a.groupid,
				a.title,
				a.descript,
				a.accounttype,
				a.initbalance,
				a.balance,
				a.currency,
				ur.role,
				a.upddate
			FROM ".$db->prefix."money_auserrole ur
			INNER JOIN ".$db->prefix."money_account a ON a.accountid=ur.accountid
			INNER JOIN ".$db->prefix."money_group g ON g.groupid=a.groupid
			WHERE a.deldate=0 AND g.deldate=0 AND ur.userid=".bkint($userid)." AND ur.role>0  
				".($groupid > 0 ? " AND a.groupid=".bkint($groupid) : "")."
				".($accountid > 0 ? " AND a.accountid=".bkint($accountid) : "")."
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
				".bkint($ad->type).",
				'".bkstr($ad->title)."',
				'".bkstr($ad->descript)."',
				".doubleval($ad->initbalance).",
				'".bkstr($ad->currency)."',
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
				accounttype=".bkint($ad->type).",
				title='".bkstr($ad->title)."',
				descript='".bkstr($ad->descript)."',
				initbalance=".doubleval($ad->initbalance).",
				currency='".bkstr($ad->currency)."',
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
			SET
			    balance = initbalance + ".doubleval($sm).",
			    upddate=".TIMENOW."
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
        foreach ($ids as $id){
            array_push($wh, "ur.groupid=".intval($id));
        }
        $sql = "
			SELECT
				ur.userid as id,
				ur.groupid,
				ur.role
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
        foreach ($ids as $id){
            array_push($wh, "ur.accountid=".intval($id));
        }
        $sql = "
			SELECT
				ur.userid as id,
				ur.accountid,
				ur.role
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

    public static function OperAppend(Ab_Database $db, $userid, $accountid, $isExpense, $operval, $operdate, $catid, $descript, $methodid = 0){
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
        return MoneyQuery::OperAppend($db, $userid, $accountid, $od->isexpense, $od->value, $od->date, $od->categoryid, $od->descript);
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

	public static function OperTagsUpdate(Ab_Database $db, $operid, $accountid, $tags){
		$sql = "
			UPDATE ".$db->prefix."money_oper
			SET tags='".bkstr($tags)."'
			WHERE operid=".bkint($operid)." AND accountid=".bkint($accountid)."
			LIMIT 1
		";
		$db->query_write($sql);
	}

	public static function OperUpdateByObj(Ab_Database $db, $operid, $accountid, $od){
        return MoneyQuery::OperUpdate($db, $operid, $accountid, $od->value, $od->date, $od->categoryid, $od->descript);
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

    public static function OperRemoveByCategoryId(Ab_Database $db, $categoryid){
        $sql = "
			UPDATE ".$db->prefix."money_oper
			SET deldate=".TIMENOW.", upddate=".TIMENOW."
			WHERE categoryid=".bkint($categoryid)."
			LIMIT 1
		";
        $db->query_write($sql);
    }

    public static function OperListByAIds(Ab_Database $db, $aids, $fromdt, $enddt, $lastUpdate = 0){
        $aw = array("o.accountid=0");
        foreach ($aids as $id){
            array_push($aw, "o.accountid=".bkint($id));
        }
        $sql = "
			SELECT
				o.operid as id,
				o.accountid,
				o.userid,
				o.isexpense,
				o.operval as v,
				o.operdate as d,
				o.categoryid,
				o.descript,
				o.tags,
				o.methodid,
				o.upddate
			FROM ".$db->prefix."money_oper o
			WHERE (o.operdate>=".bkint($fromdt)." AND o.operdate<=".bkint($enddt).") 
				AND (".implode($aw, " OR ").")
				".($lastUpdate > 0 ? " AND o.upddate>".bkint($lastUpdate) : "")."
				AND o.deldate=0
			ORDER by o.operdate DESC, o.upddate DESC
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

    public static function OperMoveListByAIds(Ab_Database $db, $aids, $fromdt, $enddt, $lastUpdate = 0){
        if (empty($aids)){
            return null;
        }
        $aw = array();
        foreach ($aids as $id){
            array_push($aw, "m.fromaccountid=".bkint($id)." OR m.toaccountid=".bkint($id));
        }
        $sql = "
			SELECT
				DISTINCT m.methodid as id,
				m.fromaccountid as srcid,
				m.toaccountid as destid,
				m.operval as v,
				m.operdate as d
			FROM ".$db->prefix."money_move m
			INNER JOIN ".$db->prefix."money_oper o ON m.methodid=o.methodid 
			WHERE (o.operdate>=".bkint($fromdt)." AND o.operdate<=".bkint($enddt).") 
				AND (".implode($aw, " OR ").")
				".($lastUpdate > 0 ? " AND o.upddate>".bkint($lastUpdate) : "")."
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
        $fromOperId = MoneyQuery::OperAppend($db, $userid, $od->srcid, true, $od->value, $od->date, 0, $od->descript, $methodid);

        // доход
        $toOperId = MoneyQuery::OperAppend($db, $userid, $od->destid, false, $od->value, $od->date, 0, $od->descript, $methodid);

        $sql = "
			INSERT INTO ".$db->prefix."money_move
			(methodid, fromaccountid, fromoperid, toaccountid, tooperid, operval, operdate) VALUES (
				".bkint($methodid).",
				".bkint($od->srcid).",
				".bkint($fromOperId).",
				".bkint($od->destid).",
				".bkint($toOperId).",
		
				".doubleval($od->value).",
				".bkint($od->date)."
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
			SET operval=".doubleval($od->value).",
				operdate=".bkint($od->date)."
			WHERE methodid=".bkint($methodid)." 
				AND fromaccountid=".bkint($od->srcid)."
				AND toaccountid=".bkint($od->destid)."
		";
        $db->query_write($sql);

        $dbMOper = MoneyQuery::OperMoveInfo($db, $methodid);
        MoneyQuery::OperUpdate($db, $dbMOper['fromoperid'], $dbMOper['fromaccountid'], $od->value, $od->date, 0, $od->descript);
        MoneyQuery::OperUpdate($db, $dbMOper['tooperid'], $dbMOper['toaccountid'], $od->value, $od->date, 0, $od->descript);
    }

    public static function OperMoveRemove(Ab_Database $db, $methodid){
		$dbMOper = MoneyQuery::OperMoveInfo($db, $methodid);
		MoneyQuery::OperRemove($db, $dbMOper['fromoperid'], $dbMOper['fromaccountid']);
		MoneyQuery::OperRemove($db, $dbMOper['tooperid'], $dbMOper['toaccountid']);
        $sql = "
			UPDATE ".$db->prefix."money_method
			SET deldate=".TIMENOW.", upddate=".TIMENOW."
			WHERE methodid=".bkint($methodid)." 
		";
        $db->query_write($sql);
    }

}
