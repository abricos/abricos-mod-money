<?php

require_once 'models.php';

class Money {

    /**
     * @var MoneyManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    /**
     * @var AbricosModelManager
     */
    public $models;

    public function __construct(MoneyManager $manager){
        $this->manager = $manager;
        $this->db = $manager->db;

        $models = $this->models = AbricosModelManager::GetManager('money');

        $models->RegisterClass('Group', 'MoneyGroup');
        $models->RegisterClass('GroupList', 'MoneyGroupList');
        $models->RegisterClass('GroupUserRole', 'MoneyGroupUserRole');
        $models->RegisterClass('GroupUserRoleList', 'MoneyGroupUserRoleList');
        $models->RegisterClass('Account', 'MoneyAccount');
        $models->RegisterClass('AccountList', 'MoneyAccountList');
        $models->RegisterClass('AccountUserRole', 'MoneyAccountUserRole');
        $models->RegisterClass('AccountUserRoleList', 'MoneyAccountUserRoleList');
        $models->RegisterClass('User', 'MoneyUser');
        $models->RegisterClass('UserList', 'MoneyUserList');
    }

    public function AJAX($d){
        switch ($d->do){
            case "appStructure":
                return $this->AppStructureToJSON();
            case 'accountList':
                return $this->AccountListToJSON();
            case 'groupList':
                return $this->GroupListToJSON();
            case 'groupUserRoleList':
                return $this->GroupUserRoleListToJSON();
            case 'accountUserRoleList':
                return $this->AccountUserRoleListToJSON();
            case 'userList':
                return $this->UserListToJSON();
        }
        return null;
    }

    private function ResultToJSON($name, $res){
        $ret = new stdClass();

        if (is_integer($res)){
            $ret->err = $res;
            return $ret;
        }
        $ret->$name = $res->ToJSON();

        return $ret;
    }

    public function AppStructureToJSON(){
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $modelManager = AbricosModelManager::GetManager('money');

        $res = $modelManager->ToJSON('Account,Group,AccountUserRole,GroupUserRole,User');
        if (empty($res)){
            return null;
        }

        $ret = new stdClass();
        $ret->appStructure = $res;
        return $ret;
    }


    public function AccountListToJSON(){
        $res = $this->AccountList();
        return $this->ResultToJSON('accountList', $res);
    }

    private $_cacheAccountList;

    /**
     * @return int|MoneyAccountList
     */
    public function AccountList(){
        if (isset($this->_cacheAccountList)){
            return $this->_cacheAccountList;
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }
        $rows = MoneyQuery::AccountList($this->db, Abricos::$user->id);
        /** @var MoneyAccountList $list */
        $list = $this->models->InstanceClass('AccountList');
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('Account', $d));
        }

        return $this->_cacheAccountList = $list;
    }

    public function GroupListToJSON(){
        $res = $this->GroupList();
        return $this->ResultToJSON('groupList', $res);
    }

    private $_cacheGroupList;

    public function GroupList(){
        if (isset($this->_cacheGroupList)){
            return $this->_cacheGroupList;
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $accountList = $this->AccountList();
        $groupIds = $accountList->ToArray('id');

        $list = $this->models->InstanceClass('GroupUserRoleList');
        $rows = MoneyQuery::GroupListByIds($this->db, $groupIds, Abricos::$user->id);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('Group', $d));
        }

        return $this->_cacheGroupList = $list;
    }

    public function GroupUserRoleListToJSON(){
        $res = $this->GroupUserRoleList();
        return $this->ResultToJSON('groupUserRoleList', $res);
    }

    private $_cacheGroupUserRoleList;

    public function GroupUserRoleList(){
        if (isset($this->_cacheGroupUserRoleList)){
            return $this->_cacheGroupUserRoleList;
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $groupList = $this->GroupList();
        $groupIds = $groupList->ToArray('id');

        $list = $this->models->InstanceClass('GroupUserRoleList');
        $rows = MoneyQuery::GUserRoleListByGId($this->db, $groupIds);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('GroupUserRole', $d));
        }

        return $this->_cacheGroupUserRoleList = $list;
    }

    public function AccountUserRoleListToJSON(){
        $res = $this->AccountUserRoleList();
        return $this->ResultToJSON('accountUserRoleList', $res);
    }

    private $_cacheAccountUserRoleList;

    public function AccountUserRoleList(){
        if (isset($this->_cacheAccountUserRoleList)){
            return $this->_cacheAccountUserRoleList;
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $accountList = $this->AccountList();
        $accountIds = $accountList->ToArray('id');

        $list = $this->models->InstanceClass('AccountUserRoleList');
        $rows = MoneyQuery::AUserRoleListByAId($this->db, $accountIds);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('AccountUserRole', $d));
        }

        return $this->_cacheAccountUserRoleList = $list;
    }

    public function UserListToJSON(){
        $res = $this->UserList();
        return $this->ResultToJSON('userList', $res);
    }

    private $_cacheUserList;

    public function UserList(){
        if (isset($this->_cacheUserList)){
            return $this->_cacheUserList;
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $userIds = $this->GroupUserRoleList()->ToArray('userid');
        $userIds += $this->AccountUserRoleList()->ToArray('userid');

        $list = $this->models->InstanceClass('UserList');
        $rows = MoneyQuery::UserListByIds($this->db, $userIds);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('User', $d));
        }
        return $this->_cacheUserList = $list;
    }
}

?>