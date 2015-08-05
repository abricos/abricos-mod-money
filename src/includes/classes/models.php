<?php

class MoneyGroup extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Group';
}

class MoneyGroupList extends AbricosModelList {

}

class MoneyGroupUserRole extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'GroupUserRole';
}

class MoneyGroupUserRoleList extends AbricosModelList {

}


class MoneyAccount extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Account';
}

class MoneyAccountList extends AbricosModelList {
    protected $_structModule = 'money';
    protected $_structName = 'AccountList';
}

class MoneyAccountUserRole extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'AccountUserRole';
}

class MoneyAccountUserRoleList extends AbricosModelList {

}


?>