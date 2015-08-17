<?php

/**
 * Class MoneyUserRole
 *
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
 * Class MoneyCategory
 *
 * @property int $id Category ID
 * @property int $parentid Parent Category ID
 * @property int $useid User ID
 * @property int $groupid Group ID
 * @property string $title Title
 * @property int $isexpense True - is Expense
 * @property int $ord Order
 * @property int $upddate Update Date
 */
class MoneyCategory extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Category';
}

/**
 * Class MoneyCategoryList
 * @method MoneyCategory Get(int $id)
 */
class MoneyCategoryList extends AbricosModelList {

}

/**
 * Class MoneyGroup
 *
 * @property MoneyUserRoleList $roles
 * @property MoneyCategoryList $categories
 */
class MoneyGroup extends MoneyUserRoleModel {
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
 *
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

class MoneyUserRoleModel extends AbricosModel {

    public function IsAdminRole(){
        return $this->role === MoneyAccountRole::ADMIN;
    }

    public function IsWriteRole(){
        return $this->IsAdminRole()
        || $this->role === MoneyAccountRole::WRITE;
    }

    public function IsReadRole(){
        return $this->IsWriteRole()
        || $this->role === MoneyAccountRole::READ;
    }
}

/**
 * Class MoneyAccount
 *
 * @property int $groupid Group ID
 * @property string $title Title
 * @property string $descript Description
 * @property int $role Role Value
 * @property int $type Account Type
 * @property double $initbalance Init Balance
 * @property double $balance Current Balance
 * @property string $currency Currency Code (ID)
 * @property int $upddate Update Date
 * @property MoneyUserRoleList $roles User Role List
 */
class MoneyAccount extends MoneyUserRoleModel {
    protected $_structModule = 'money';
    protected $_structName = 'Account';

}

/**
 * Class MoneyAccountList
 * @method MoneyAccount Get(int $accountid)
 */
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