<?php

class MoneyGroup extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Group';
}

class MoneyGroupList extends AbricosModelList {

}

class MoneyAccount extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Account';
}

class MoneyAccountList extends AbricosModelList {
    protected $_structModule = 'money';
    protected $_structName = 'AccountList';
}


?>