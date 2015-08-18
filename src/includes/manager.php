<?php
/**
 * @package Abricos
 * @subpackage Money
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@Abricos.org)
 */

require_once 'dbquery.php';

class MoneyManager extends Ab_ModuleManager {

    /**
     * @var MoneyModule
     */
    public $module = null;

    /**
     * @var MoneyManager
     */
    public static $instance = null;

    public function __construct(MoneyModule $module){
        parent::__construct($module);

        MoneyManager::$instance = $this;
    }

    public function IsAdminRole(){
        return $this->IsRoleEnable(MoneyAction::ADMIN);
    }

    public function IsWriteRole(){
        if ($this->IsAdminRole()){
            return true;
        }
        return $this->IsRoleEnable(MoneyAction::WRITE);
    }

    public function IsViewRole(){
        if ($this->IsWriteRole()){
            return true;
        }
        return $this->IsRoleEnable(MoneyAction::VIEW);
    }

    private $_money = null;

    /**
     * @return Money
     */
    public function GetMoney(){
        if (!is_null($this->_money)){
            return $this->_money;
        }
        require_once 'classes/money.php';
        $this->_money = new Money($this);
        return $this->_money;
    }

    public function AJAX($d){
        return $this->GetMoney()->AJAX($d);

        switch ($d->do){
            case 'init':
                return $this->BoardData();
            case 'groupsave':
                return $this->GroupSave($d->group);
            case 'groupremove':
                return $this->GroupRemove($d->groupid);
            case 'accountsave':
                return $this->AccountSave($d->account);
            case 'accountremove':
                return $this->AccountRemove($d->accountid);
            case 'opersave':
                return $this->OperSave($d->oper);
            case 'operremove':
                return $this->OperRemove($d->operid);
            case 'opermovesave':
                return $this->OperMoveSave($d->oper);
            case 'opermoveremove':
                return $this->OperMoveRemove($d->methodid);
            case 'operlog':
                return $this->OperLogList($d->groupid, $d->fromdt, $d->enddt, $d->lastupdate);
        }
        return null;
    }

    public function ToArray($rows, &$ids1 = "", $fnids1 = 'uid', &$ids2 = "", $fnids2 = '', &$ids3 = "", $fnids3 = ''){
        $ret = array();
        while (($row = $this->db->fetch_array($rows))){
            array_push($ret, $row);
            if (is_array($ids1)){
                $ids1[$row[$fnids1]] = $row[$fnids1];
            }
            if (is_array($ids2)){
                $ids2[$row[$fnids2]] = $row[$fnids2];
            }
            if (is_array($ids3)){
                $ids3[$row[$fnids3]] = $row[$fnids3];
            }
        }
        return $ret;
    }

    public function ToArrayId($rows, $field = "id"){
        $ret = array();
        while (($row = $this->db->fetch_array($rows))){
            $ret[$row[$field]] = $row;
        }
        return $ret;
    }

    public function BoardData(){
        if (!$this->IsViewRole()){
            return null;
        }

        $ret = new stdClass();

        $gids = array();
        $aids = array();
        $uids = array($this->userid);

        $rows = MoneyQuery::AccountList($this->db, $this->userid);
        $ret->accounts = $this->ToArray($rows, $aids, "id", $gids, "gid");

        $rows = MoneyQuery::GroupListByIds($this->db, $gids, $this->userid);
        $ret->groups = $this->ToArray($rows);

        $rows = MoneyQuery::GUserRoleListByGId($this->db, $gids);
        $ret->groles = $this->ToArray($rows, $uids, "u");

        $rows = MoneyQuery::AUserRoleListByAId($this->db, $aids);
        $ret->aroles = $this->ToArray($rows, $uids, "u");

        $rows = MoneyQuery::UserListByIds($this->db, $uids);
        $ret->users = $this->ToArray($rows);

        // для проверки занесенных категорий
        $ckuids = array();
        $rows = MoneyQuery::CategoryList($this->db, $gids);
        $ret->categories = $this->ToArray($rows);

        return $ret;
    }

    public function GroupSave($gd){
        if (!$this->IsWriteRole()){
            return null;
        }


        $dbGroup = null;
        if ($gd->id == 0){
        } else {

        }

        if (empty($dbGroup)){
            return null; // мистика какая то, но все же
        }

        $rows = MoneyQuery::AccountList($this->db, $this->userid, $gd->id);
        $dbAccounts = $this->ToArrayId($rows);

        // Добавить/обновить счета
        foreach ($gd->accounts as $ad){
            $this->AccountSaveMethod($dbGroup['id'], $ad);
        }

        // Удалить счета
        foreach ($dbAccounts as $dbAccount){
            $find = false;
            foreach ($gd->accounts as $ad){
                if ($dbAccount['id'] == $ad->id){
                    $find = true;
                    break;
                }
            }
            if (!$find){
                $this->AccountRemove($dbAccount['id']);
            }
        }

        $ret = $this->BoardData();
        $ret->groupid = $gd->id;

        return $ret;
    }

    public function GroupRemove($groupid){
        if (!$this->IsWriteRole()){
            return null;
        }
        $dbGroup = MoneyQuery::GroupById($this->db, $groupid, $this->userid);

        if (empty($dbGroup) || $dbGroup['r'] != MoneyAccountRole::ADMIN){
            return null;
        }
        MoneyQuery::GroupRemove($this->db, $groupid);

        $ret = new stdClass();
        $ret->deldate = TIMENOW;
        return $ret;
    }

    public function AccountRemove($accountid){
        if (!$this->IsWriteRole()){
            return null;
        }
        $dbAccount = MoneyQuery::Account($this->db, $this->userid, $accountid);

        if (empty($dbAccount) || $dbAccount['r'] != MoneyAccountRole::ADMIN){
            return null;
        }

        MoneyQuery::AccountRemove($this->db, $accountid);

        $ret = new stdClass();
        $ret->deldate = TIMENOW;
        return $ret;
    }

    public function AccountSave($ad){
        if (!$this->IsWriteRole()){
            return null;
        }
        $accountid = $this->AccountSaveMethod($ad->gid, $ad);

        $ret = new stdClass();
        $ret->account = MoneyQuery::Account($this->db, $this->userid, $accountid);

        $rows = MoneyQuery::AUserRoleListByAId($this->db, array($accountid));
        $ret->roles = $this->ToArray($rows);

        return $ret;
    }


    private $_asvGroupCache = array();
    private $_asvAccountsCache = null;

    private function AccountSaveMethod($groupid, $ad){

        $userid = $this->userid;

        if (!$this->_asvGroupCache[$groupid]){
            $this->_asvGroupCache[$groupid] = MoneyQuery::GroupById($this->db, $groupid, $this->userid);
        }
        $dbGroup = $this->_asvGroupCache[$groupid];
        if (empty($dbGroup)){
            return null;
        }

        if (is_null($this->_asvAccountsCache)){
            $rows = MoneyQuery::AccountList($this->db, $userid);
            $this->_asvAccountsCache = $this->ToArrayId($rows);
        }
        $dbAccounts = $this->_asvAccountsCache;

        $fps = Abricos::TextParser(true);

        $ad->id = intval($ad->id);
        $ad->ibc = doubleval($ad->ibc); // start balance
        $ad->tl = $fps->Parser($ad->tl); // title
        $ad->dsc = $fps->Parser($ad->dsc); // descript
        $ad->tp = intval($ad->tp); // account type
        $ad->cc = $fps->Parser($ad->cc); // curency

        if ($ad->id == 0){
            // добавлять новые счета может пользователь, который имеет
            // право на чтение в этой группе
            if ($dbGroup['r'] < MoneyAccountRole::READ){
                return null;
            }

            $ad->id = MoneyQuery::AccountAppend($this->db, $userid, $groupid, $ad);

            foreach ($ad->roles as $r){
                MoneyQuery::AUserRoleAppend($this->db, $ad->id, $r->u, $r->r);
            }

        } else {

            // обновлять аккаунт, его роли может только пользователь с правами
            // админа на этот аккаунт
            $dbAccount = $dbAccounts[$ad->id];
            if (empty($dbAccount) || $dbAccount['r'] != MoneyAccountRole::ADMIN){
                return null;
            }

            MoneyQuery::AccountUpdate($this->db, $ad->id, $ad);

            // обновление ролей доступа к аккаунтам
            $rows = MoneyQuery::AUserRoleListByAId($this->db, array($ad->id));
            $dbRoles = $this->ToArrayId($rows, "u");
            foreach ($ad->roles as $role){
                if (empty($dbRoles[$role->u])){
                    MoneyQuery::AUserRoleAppend($this->db, $ad->id, $role->u, $role->r);
                } else {
                    MoneyQuery::AUserRoleUpdate($this->db, $ad->id, $role->u, $role->r);
                }
            }

            foreach ($dbRoles as $dbRole){
                $find = false;
                foreach ($ad->roles as $role){
                    if ($dbRole['u'] == $role->u){
                        $find = true;
                    }
                }
                if (!$find && $userid != $dbRole['u']){ // удалять свою роль нельзя
                    MoneyQuery::AUserRoleRemove($this->db, $ad->id, $dbRole['u']);
                }
            }
        }
        MoneyQuery::AccountUpdateBalance($this->db, $ad->id);
        return $ad->id;
    }

    public function OperRemove($operid){
        $dbOper = MoneyQuery::OperInfo($this->db, $operid);
        $dbAccount = MoneyQuery::Account($this->db, $this->userid, $dbOper['accountid']);
        if (empty($dbAccount) || $dbAccount['r'] < MoneyAccountRole::WRITE){
            return null;
        }

        MoneyQuery::OperRemove($this->db, $operid, $dbOper['accountid']);

        MoneyQuery::AccountUpdateBalance($this->db, $dbOper['accountid']);

        $account = MoneyQuery::Account($this->db, $this->userid, $dbOper['accountid']);
        $ret = new stdClass();
        $ret->balance = new stdClass();
        $ret->balance->accountid = $account['id'];
        $ret->balance->value = $account['bc'];
        return $ret;
    }

    public function OperMoveRemove($methodid){
        $dbMOper = MoneyQuery::OperMoveInfo($this->db, $methodid);
        $dbFAccount = MoneyQuery::Account($this->db, $this->userid, $dbMOper['fromaccountid']);
        $dbTAccount = MoneyQuery::Account($this->db, $this->userid, $dbMOper['toaccountid']);

        if (empty($dbFAccount) || empty($dbTAccount) || $dbFAccount['r'] < MoneyAccountRole::WRITE || $dbTAccount['r'] < MoneyAccountRole::WRITE
        ){
            return null;
        }

        MoneyQuery::OperMoveRemove($this->db, $methodid);
        MoneyQuery::AccountUpdateBalance($this->db, $dbFAccount['id']);
        MoneyQuery::AccountUpdateBalance($this->db, $dbTAccount['id']);


        // TODO: Повторение кода, необходима оптимизация
        $account = MoneyQuery::Account($this->db, $this->userid, $dbFAccount['id']);
        $ret1 = new stdClass();
        $ret1->balance = new stdClass();
        $ret1->balance->accountid = $account['id'];
        $ret1->balance->value = $account['bc'];

        $account = MoneyQuery::Account($this->db, $this->userid, $dbTAccount['id']);
        $ret2 = new stdClass();
        $ret2->balance = new stdClass();
        $ret2->balance->accountid = $account['id'];
        $ret2->balance->value = $account['bc'];

        return array(
            $ret1,
            $ret2
        );
    }

    public function OperMoveSave($od){

        $dbFAccount = MoneyQuery::Account($this->db, $this->userid, $od->faid);
        $dbTAccount = MoneyQuery::Account($this->db, $this->userid, $od->taid);

        if (empty($dbFAccount) || empty($dbTAccount) || $dbFAccount['r'] < MoneyAccountRole::WRITE || $dbTAccount['r'] < MoneyAccountRole::WRITE || $dbFAccount['gid'] != $dbTAccount['gid']
        ){
            return null;
        }

        $fps = Abricos::TextParser(true);
        $od->dsc = $fps->Parser($od->dsc);
        $od->v = abs(doubleval($od->v));

        if ($od->id == 0){
            MoneyQuery::OperMoveAppend($this->db, $this->userid, $od);
        } else {
            $dbMOper = MoneyQuery::OperMoveInfo($this->db, $od->id);
            if (empty($dbMOper) || $dbMOper['fromaccountid'] != $dbFAccount['id'] || $dbMOper['toaccountid'] != $dbTAccount['id']
            ){
                // изменение счета невозможно в этой версии
                return null;
            }
            MoneyQuery::OperMoveUpdate($this->db, $od->id, $od);
        }

        MoneyQuery::AccountUpdateBalance($this->db, $od->faid);
        MoneyQuery::AccountUpdateBalance($this->db, $od->taid);

        $account = MoneyQuery::Account($this->db, $this->userid, $od->faid);
        $ret1 = new stdClass();
        $ret1->balance = new stdClass();
        $ret1->balance->accountid = $account['id'];
        $ret1->balance->value = $account['bc'];

        $account = MoneyQuery::Account($this->db, $this->userid, $od->taid);
        $ret2 = new stdClass();
        $ret2->balance = new stdClass();
        $ret2->balance->accountid = $account['id'];
        $ret2->balance->value = $account['bc'];

        return array(
            $ret1,
            $ret2
        );
    }

    public function OperLogList($groupid, $fromdt, $enddt, $lastupdate = 0){
        if (!$this->IsViewRole()){
            return null;
        }

        $aids = array();
        $rows = MoneyQuery::AccountList($this->db, $this->userid, $groupid);
        $accounts = $this->ToArray($rows, $aids, "id");


        return $ret;
    }



    public function Bos_MenuData(){
        if (!$this->IsViewRole()){
            return null;
        }
        $lng = $this->module->GetI18n();
        return array(
            array(
                "name" => "money",
                "title" => $lng['bosmenu']['title'],
                "icon" => "/modules/money/images/money-24.png",
                "url" => "money/wspace/ws/"
            )
        );
    }

}

?>