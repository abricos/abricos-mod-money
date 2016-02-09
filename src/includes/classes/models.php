<?php
/**
 * @package Abricos
 * @subpackage Money
 * @copyright 2011-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */

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
 * @method MoneyUserRole GetByIndex(int $index)
 */
class MoneyUserRoleList extends AbricosModelList {

}

/**
 * Class MoneyBalance
 *
 * @property int $id Account ID
 * @property int $balance Account Balance
 */
class MoneyBalance extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Balance';
}

/**
 * Class MoneyBalanceList
 * @method MoneyBalance Get(int $accountid)
 * @method MoneyBalance GetByIndex(int $index)
 */
class MoneyBalanceList extends AbricosModelList {

}

/**
 * Class MoneyCategory
 *
 * @property int $id Category ID
 * @property int $parentid Parent Category ID
 * @property int $useid User ID
 * @property int $groupid Group ID
 * @property string $title Title
 * @property int $isexpense True - is Expense, else Income
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
 * @method MoneyCategory GetByIndex(int $i)
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
 * @method MoneyAccount GetByIndex(int $i)
 */
class MoneyAccountList extends AbricosModelList {
}

class MoneyUser extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'User';
}

class MoneyUserList extends AbricosModelList {

}

/**
 * Class MoneyOper
 *
 * @property int $accountid Account ID
 * @property int $userid User ID
 * @property int $groupid Group ID
 * @property int $isexpense True - is Expense, else Income
 * @property double $value Value
 * @property int $date Value Date
 * @property int $categoryid Category ID
 * @property string $descript Description
 * @property string $tags Tags
 * @property int $methodid Method ID
 * @property int $upddate Update Date
 */
class MoneyOper extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'Oper';
}

/**
 * Class MoneyOperList
 */
class MoneyOperList extends AbricosModelList {

}

/**
 * Class MoneyOperMove
 *
 * @property int $srcid Soruce Account ID
 * @property int destid Dest Account ID
 * @property double $value Value
 * @property int $date Value Date
 */
class MoneyOperMove extends AbricosModel {
    protected $_structModule = 'money';
    protected $_structName = 'OperMove';
}

/**
 * Class MoneyOperMoveList
 */
class MoneyOperMoveList extends AbricosModelList {

}

?>