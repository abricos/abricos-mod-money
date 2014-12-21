<?php

class MoneyAccountRole {
    const ACCESSDENIED = 0;
    const READ = 1;
    const WRITE = 2;
    const ADMIN = 3;
}

class MoneyAccount extends AbricosItem {

    public $groupid;
    public $title;
    public $descript;
    public $accounttype;
    public $initbalance;
    public $currency;
    public $upddate;

    protected $_data;

    public function __construct($d) {
        parent::__construct($d);

        $this->_data = $this->_data;

        $this->groupid = intval($d['groupid']);
        $this->title = strval($d['title']);
        $this->descript = strval($d['descript']);
        $this->accounttype = intval($d['accounttype']);
        $this->initbalance = doubleval($d['initbalance']);
        $this->currency = strval($d['currency']);
        $this->upddate = intval($d['upddate']);
    }

    public function UserRole(){
        return $this->_data['_role'];
    }

    public function ToAJAX() {
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
}

?>