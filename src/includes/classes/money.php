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

        $models->RegisterClass('Account', 'MoneyAccount');
        $models->RegisterClass('AccountList', 'MoneyAccountList');
        $models->RegisterClass('Group', 'MoneyGroup');
        $models->RegisterClass('GroupList', 'MoneyGroupList');
    }

    public function AJAX($d){
        switch ($d->do){
            case "appStructure":
                return $this->AppStructureToJSON();
            case 'accountList':
                return $this->AccountListToJSON();
            case 'groupList':
                return $this->GroupListToJSON();
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

        $res = $modelManager->ToJSON('Account,Group');
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
        $groupIds = $accountList->ToArray('groupid');

        $list = $this->models->InstanceClass('GroupList');
        $rows = MoneyQuery::GroupListByIds($this->db, $groupIds, Abricos::$user->id);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('Group', $d));
        }

        return $this->_cacheGroupList = $list;
    }
}

?>