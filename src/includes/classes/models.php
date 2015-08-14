<?php

/**
 * Class MoneyUserRole
 * @property int $id User ID
 * @property int $role User Role Value
 */
class MoneyUserRole extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'UserRole';
}

/**
 * Class MoneyUserRoleList
 * @method MoneyUserRole Get(int $userid)
 */
class MoneyUserRoleList extends AbricosModelList {

}

/**
 * Class MoneyGroup
 * @property MoneyUserRoleList $roles
 */
class MoneyGroup extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Group';
}

/**
 * Class MoneyGroupList
 * @method MoneyGroup Get(int $groupid)
 */
class MoneyGroupList extends AbricosModelList {

}

/**
 * Class MoneyGroupUserRole
 * @property int $groupid Group ID
 * @property int $userid User ID
 * @property int $role Role Value
 */
class MoneyGroupUserRole extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'GroupUserRole';
}

/**
 * Class MoneyGroupUserRoleList
 */
class MoneyGroupUserRoleList extends AbricosModelList {

    /**
     * @param int $groupid
     * @param int $userid
     * @return MoneyGroupUserRole
     */
    public function Get($groupid, $userid = 0){
        if ($userid === 0){
            $userid = Abricos::$user->id;
        }
        return parent::Get(intval($groupid).'_'.intval($userid));
    }
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

class MoneyUser extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'User';
}

class MoneyUserList extends AbricosModelList {

}

?>