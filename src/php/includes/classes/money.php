<?php

require_once 'structure.php';

class MoneyManager {

    /**
     * @var MoneyModuleManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    public function __construct(MoneyModuleManager $manager){
        $this->manager = $manager;
        $this->db = $manager->db;
    }

    public function AJAX($d){

        switch ($d->do){

            case 'accountList':
                return $this->AccountListToAJAX();

        }

        return null;
    }

    public function AccountListToAJAX(){
        $list = $this->AccountList();
        if (empty($list)){
            return 403;
        }
        $ret = new stdClass();
        $ret->accountList = $list->ToAJAX();
        return $ret;
    }

    private $_cacheAccountList;

    /**
     * @return MoneyAccountList|null
     */
    public function AccountList(){
        if (!empty($this->_cacheAccountList)){
            return $this->_cacheAccountList;
        }

        if (!$this->manager->IsViewRole()){
            return null;
        }

        $list = new MoneyAccountList();
        $rows = MoneyQuery::AccountList($this->db, Abricos::$user->id);

        while (($d = $this->db->fetch_array($rows))){
            $list->Add(new MoneyAccount($d));
        }

        $accountIds = $list->Ids();

        if (count($accountIds) > 0){
            $rows = MoneyQuery::AccountUserRoleList($this->db, $accountIds);

            while (($d = $this->db->fetch_array($rows))){
                $account = $list->Get($d['accountid']);
                $account->userRoleList->Add(new MoneyAccountUserRole($d));
            }
        }

        $this->_cacheAccountList = $list;
        return $list;
    }


    public function GroupSaveToAJAX($d){
        $ret = $this->GroupSave($d);

        if (empty($ret)){
            return 403;
        }

        $ret = new stdClass();
        $ret->groupData = $ret;
        return $ret;
    }

    /**
     * @param $gd
     * @return int
     */
    public function GroupSave($gd){
        if (!$this->IsWriteRole()){
            return 403;
        }

        $parser = Abricos::TextParser(true);
        $gd->id = intval($gd->id);
        $gd->tl = $parser->Parser($gd->tl);

        $dbGroup = null;
        if ($gd->id == 0){
            $gd->id = MoneyQuery::GroupAppend($this->db, $this->userid, $gd);

            // добавление ролей
            foreach ($gd->roles as $r){
                MoneyQuery::GUserRoleAppend($this->db, $gd->id, $r->u, $r->r);
            }

            $dbGroup = MoneyQuery::GroupById($this->db, $gd->id, $this->userid);

            $this->CategoryInit($gd->id);
        } else {
            $dbGroup = MoneyQuery::GroupById($this->db, $gd->id, $this->userid);

            if (empty($dbGroup)){
                return null;
            }

            if ($dbGroup['r'] == MoneyAccountRole::ADMIN){
                // Только админ может: изменять данные по бухгалтерии (название, роли пользователей)
                MoneyQuery::GroupUpdate($this->db, $gd->id, $gd);

                $rows = MoneyQuery::GUserRoleListByGId($this->db, array($gd->id));

                $dbRoles = $this->ToArrayId($rows, "u");
                foreach ($gd->roles as $role){
                    if (empty($dbRoles[$role->u])){
                        MoneyQuery::GUserRoleAppend($this->db, $gd->id, $role->u, $role->r);
                    } else {
                        MoneyQuery::GUserRoleUpdate($this->db, $gd->id, $role->u, $role->r);
                    }
                }

                foreach ($dbRoles as $dbRole){
                    $find = false;
                    foreach ($gd->roles as $role){
                        if ($dbRole['u'] == $role->u){
                            $find = true;
                        }
                    }
                    if (!$find && $this->userid != $dbRole['u']){ // свою роль удалить нельзя
                        MoneyQuery::GUserRoleRemove($this->db, $gd->id, $dbRole['u']);
                    }
                }
            }
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


}

?>