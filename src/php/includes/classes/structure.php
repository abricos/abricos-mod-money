<?php

class MoneyAccount extends AbricosItem {

    public $groupid;
    public $title;
    public $descript;
    public $accounttype;
    public $initbalance;
    public $currency;
    public $upddate;

    protected $_data;

    /**
     * @var MoneyAccountUserRoleList
     */
    public $userRoleList;

    public function __construct($d){
        parent::__construct($d);

        $this->_data = $this->_data;

        $this->groupid = intval($d['groupid']);
        $this->title = strval($d['title']);
        $this->descript = strval($d['descript']);
        $this->accounttype = intval($d['accounttype']);
        $this->initbalance = doubleval($d['initbalance']);
        $this->currency = strval($d['currency']);
        $this->upddate = intval($d['upddate']);

        $this->userRoleList = new MoneyAccountUserRoleList();
    }

    /*
    public function UserRole(){
        return $this->_data['_role'];
    }
    /**/

    public function ToAJAX(){
        $ret = parent::ToAJAX();

        $ret->groupid = $this->groupid;
        $ret->title = $this->title;
        $ret->descript = $this->descript;
        $ret->accounttype = $this->accounttype;
        $ret->initbalance = $this->initbalance;
        $ret->currency = $this->currency;
        $ret->upddate = $this->upddate;
        $ret->_role = $this->UserRole();

        return $ret;
    }
}

class MoneyAccountList extends AbricosList {

    /**
     * @param $i
     * @return MoneyAccount
     */
    public function GetByIndex($i){
        return parent::GetByIndex($i);
    }

    /**
     * @param mixed $id
     * @return MoneyAccount
     */
    public function Get($id){
        return parent::Get($id);
    }

}


class MoneyAccountUserRole extends AbricosItem {

    const ACCESSDENIED = 0;
    const READ = 1;
    const WRITE = 2;
    const ADMIN = 3;

    public $userid;
    public $role;

    public function __construct($d){
        parent::__construct($d);

        $this->userid = intval($d['userid']);
        $this->role = intval($d['role']);
    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();

        $ret->userid = $this->userid;
        $ret->role = $this->role;

        return $ret;
    }
}

class MoneyAccountUserRoleList extends AbricosList {
}


class MoneyGroup extends AbricosItem {
    public $userid;
    public $title;
    public $dateline;

    protected $_data;

    public function __construct($d){
        parent::__construct($d);

        $this->_data = $d;

        $this->userid = intval($d['userid']);
        $this->title = strval($d['title']);
        $this->dateline = intval($d['dateline']);
    }

    public function ToAJAX(){
        $ret = parent::ToAJAX();

        $ret->userid = $this->userid;
        $ret->title = $this->title;
        $ret->dateline = $this->dateline;

        return $ret;
    }
}

class MoneyGroupList extends AbricosList {
}


?>