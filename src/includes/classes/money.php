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

    protected $_cache = array();

    public function __construct(MoneyManager $manager){
        $this->manager = $manager;
        $this->db = $manager->db;

        $models = $this->models = AbricosModelManager::GetManager('money');

        $models->RegisterClass('UserRole', 'MoneyUserRole');
        $models->RegisterClass('UserRoleList', 'MoneyUserRoleList');
        $models->RegisterClass('Group', 'MoneyGroup');
        $models->RegisterClass('GroupList', 'MoneyGroupList');
        $models->RegisterClass('Account', 'MoneyAccount');
        $models->RegisterClass('AccountList', 'MoneyAccountList');
        $models->RegisterClass('User', 'MoneyUser');
        $models->RegisterClass('UserList', 'MoneyUserList');
        $models->RegisterClass('Category', 'MoneyCategory');
        $models->RegisterClass('CategoryList', 'MoneyCategoryList');
        $models->RegisterClass('Oper', 'MoneyOper');
        $models->RegisterClass('OperList', 'MoneyOperList');
        $models->RegisterClass('Balance', 'MoneyBalance');
        $models->RegisterClass('BalanceList', 'MoneyBalanceList');
    }

    public function AJAX($d){
        switch ($d->do){
            case "appStructure":
                return $this->AppStructureToJSON();
            case 'accountList':
                return $this->AccountListToJSON();
            case 'accountSave':
                return $this->AccountSaveToJSON($d->account);
            case 'accountRemove':
                return $this->AccountRemoveToJSON($d->account);
            case 'groupList':
                return $this->GroupListToJSON();
            case 'groupSave':
                return $this->GroupSaveToJSON($d->group);
            case 'groupRemove':
                return $this->GroupRemoveToJSON($d->groupid);
            case 'categorySave':
                return $this->CategorySaveToJSON($d->category);
            case 'categoryRemove':
                return $this->CategoryRemoveToJSON($d->category);
            case 'userList':
                return $this->UserListToJSON();
            case 'operSave':
                return $this->OperSaveToJSON($d->oper);
            case 'operMoveSave':
                return $this->OperMoveSaveToJSON($d->operMove);
            case 'operList':
                return $this->OperListToJSON($d->operListConfig);
        }
        return null;
    }

    public function ClearCache(){
        $this->_cache = array();
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

    private function ImplodeJSON($jsons, $ret = null){
        if (empty($ret)){
            $ret = new stdClass();
        }
        foreach ($jsons as $json){
            foreach ($json as $key => $value){
                $ret->$key = $value;
            }
        }
        return $ret;
    }

    public function AppStructureToJSON(){
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $modelManager = AbricosModelManager::GetManager('money');

        $res = $modelManager->ToJSON(
            'Group,Account,Category,CategoryList,'.
            'UserRole,UserRoleList,User,Oper,OperList,Balance'
        );
        if (empty($res)){
            return null;
        }

        $ret = new stdClass();
        $ret->appStructure = $res;
        return $ret;
    }

    public function FullDataToJSON(){
        $this->ClearCache();
        return $this->ImplodeJSON(array(
            $this->GroupListToJSON(),
            $this->AccountListToJSON(),
            $this->UserListToJSON()
        ));
    }

    public function AccountListToJSON(){
        $res = $this->AccountList();
        return $this->ResultToJSON('accountList', $res);
    }

    /**
     * @return int|MoneyAccountList
     */
    public function AccountList(){
        if (isset($this->_cache['AccountList'])){
            return $this->_cache['AccountList'];
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

        $accountIds = $list->ToArray('id');

        $rows = MoneyQuery::AUserRoleListByAId($this->db, $accountIds);
        while (($d = $this->db->fetch_array($rows))){
            $account = $list->Get($d['accountid']);
            if (empty($account)){
                continue;
            }
            $account->roles->Add($this->models->InstanceClass('UserRole', $d));
        }

        return $this->_cache['AccountList'] = $list;
    }

    public function GroupListToJSON(){
        $res = $this->GroupList();
        return $this->ResultToJSON('groupList', $res);
    }

    /**
     * @return MoneyGroupList
     */
    public function GroupList(){
        if (isset($this->_cache['GroupList'])){
            return $this->_cache['GroupList'];
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $groupIds = $this->AccountList()->ToArray('groupid');

        /** @var MoneyGroupList $list */
        $list = $this->models->InstanceClass('GroupList');
        $rows = MoneyQuery::GroupListByIds($this->db, $groupIds, Abricos::$user->id);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('Group', $d));
        }

        $rows = MoneyQuery::GUserRoleListByGId($this->db, $groupIds);
        while (($d = $this->db->fetch_array($rows))){
            $group = $list->Get($d['groupid']);
            if (empty($group)){
                continue;
            }
            $group->roles->Add($this->models->InstanceClass('UserRole', $d));
        }

        $rows = MoneyQuery::CategoryList($this->db, $groupIds);
        while (($d = $this->db->fetch_array($rows))){
            $group = $list->Get($d['groupid']);
            if (empty($group)){
                continue;
            }
            $group->categories->Add($this->models->InstanceClass('Category', $d));
        }

        return $this->_cache['GroupList'] = $list;
    }

    public function BalanceListToJSON(){
        $res = $this->BalanceList();
        return $this->ResultToJSON('balanceList', $res);
    }

    public function BalanceList(){
        if (isset($this->_cache['BalanceList'])){
            return $this->_cache['BalanceList'];
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $accountList = $this->AccountList();
        $list = $this->models->InstanceClass('BalanceList');
        for ($i = 0; $i < $accountList->Count(); $i++){
            $account = $accountList->GetByIndex($i);
            $list->Add($this->models->InstanceClass('Balance', array(
                "id" => $account->id,
                "balance" => $account->balance,
                "upddate" => $account->upddate
            )));
        }

        return $this->_cache['BalanceList'] = $list;
    }

    public function OperSaveToJSON($d){
        $res = $this->OperSave($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        if (isset($res->categoryid)){
            $res = $this->ImplodeJSON(array(
                $this->GroupListToJSON()
            ), $res);
        }

        $res = $this->ImplodeJSON(array(
            $this->BalanceListToJSON()
        ), $res);

        return $res;
    }

    public function OperSave($od){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }

        $parser = Abricos::TextParser(true);
        $od->isexpense = empty($od->isexpense) ? 0 : 1;
        $od->descript = $parser->Parser($od->descript);
        $od->value = doubleval($od->value);
        $od->accountid = intval($od->accountid);
        $od->date = intval($od->date);
        $od->upddate = intval($od->upddate);

        $account = $this->AccountList()->Get($od->accountid);

        if (empty($account) || !$account->IsWriteRole()){
            return 403;
        }
        $group = $this->GroupList()->Get($account->groupid);
        if (empty($group)){
            return 403;
        }

        $ret = new stdClass();

        $isNewCategory = $od->categoryid === -1 && $group->IsWriteRole();
        if ($isNewCategory){
            $cnew = $od->categoryData;
            $cnew->title = $parser->Parser($cnew->title);
            $od->categoryid = $this->CategoryAppendMethod($group->id, $cnew->title, $od->isexpense, $cnew->parentid);
        }

        if ($od->id == 0){
            $od->id = MoneyQuery::OperAppendByObj($this->db, Abricos::$user->id, $od->accountid, $od);
        } else {
            MoneyQuery::OperUpdateByObj($this->db, $od->id, $od->accountid, $od);
        }

        $ret->operid = $od->id;
        if ($isNewCategory){
            $ret->categoryid = $od->categoryid;
        }

        MoneyQuery::AccountUpdateBalance($this->db, $od->accountid);

        $this->ClearCache();

        return $ret;
    }

    public function OperMoveSaveToJSON($d){
        $res = $this->OperMoveSave($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        $res = $this->ImplodeJSON(array(
            $this->BalanceListToJSON()
        ), $res);

        return $res;
    }

    public function OperMoveSave($d){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }
        $parser = Abricos::TextParser(true);
        $d->id = intval($d->id);
        $d->descript = $parser->Parser($d->descript);
        $d->value = doubleval($d->value);
        $d->srcid = intval($d->srcid);
        $d->destid = intval($d->destid);
        $d->date = intval($d->date);
        $d->upddate = intval($d->upddate);

        $srcAccount = $this->AccountList()->Get($d->srcid);
        $destAccount = $this->AccountList()->Get($d->destid);

        if (empty($srcAccount) || !$srcAccount->IsWriteRole()
            || empty($destAccount) || !$destAccount->IsWriteRole()
            || $srcAccount->groupid !== $destAccount->groupid
        ){
            return 403;
        }

        if ($d->id === 0){
            $d->id = MoneyQuery::OperMoveAppend($this->db, Abricos::$user->id, $d);
        } else {
            $dbMOper = MoneyQuery::OperMoveInfo($this->db, $d->id);
            if (empty($dbMOper)
                || $dbMOper['fromaccountid'] != $d->srcid
                || $dbMOper['toaccountid'] != $d->destid
            ){
                // изменение счета невозможно в этой версии
                return null;
            }
            MoneyQuery::OperMoveUpdate($this->db, $d->id, $d);
        }

        MoneyQuery::AccountUpdateBalance($this->db, $d->srcid);
        MoneyQuery::AccountUpdateBalance($this->db, $d->destid);

        $ret = new stdClass();
        $ret->opermoveid = $d->id;

        $this->ClearCache();

        return $ret;
    }

    public function GroupRemoveToJSON($groupid){
        $res = $this->GroupRemove($groupid);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        $ret = $this->FullDataToJSON();
        $ret->groupSave = $res;

        return $ret;
    }

    public function GroupRemove($groupid){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }

        $groupid = intval($groupid);
        $group = $this->GroupList()->Get($groupid);

        if (empty($group) || !$group->IsAdminRole()){
            return 403;
        }

        MoneyQuery::GroupRemove($this->db, $groupid);

        $this->ClearCache();

        $ret = new stdClass();
        $ret->groupid = $groupid;
        return $ret;
    }

    public function GroupSaveToJSON($d){
        $res = $this->GroupSave($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        $ret = $this->FullDataToJSON();
        $ret->groupSave = $res;

        return $ret;
    }

    public function GroupSave($d){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }

        $parser = Abricos::TextParser(true);
        $d->id = intval($d->id);
        $d->title = $parser->Parser($d->title);

        if (intval($d->id) === 0){
            $d->id = $this->GroupAppendMethod($d);
        } else if (($err = $this->GroupUpdateMethod($d)) > 0){
            return $err;
        }

        $this->ClearCache();

        $ret = new stdClass();
        $ret->groupid = $d->id;
        return $ret;
    }

    private function GroupAppendMethod($d){
        $groupid = MoneyQuery::GroupAppend($this->db, Abricos::$user->id, $d);

        // добавление ролей
        foreach ($d->roles as $r){
            MoneyQuery::GUserRoleAppend($this->db, $groupid, $r->u, $r->r);
        }

        foreach ($d->accounts as $accountData){
            $this->AccountAppendMethod($groupid, $accountData);
        }

        $this->CategoryInit($groupid);

        return $groupid;
    }

    private function GroupUpdateMethod($d){
        $groupList = $this->GroupList();
        $group = $groupList->Get($d->id);

        if (empty($group)){
            return 500;
        }

        $groupid = $d->id;
        $accountList = $this->AccountList();

        foreach ($d->accounts as $ad){
            if ($ad->id === 0 && $group->IsReadRole()){
                $this->AccountAppendMethod($groupid, $ad);
            } else {
                $account = $accountList->Get($ad->id);
                if (empty($account)){
                    continue; // hm...
                }
                if ($group->IsAdminRole() || $account->IsAdminRole()){
                    $this->AccountUpdateMethod($ad);
                }
            }
        }

        // Только админ может: изменять данные по бухгалтерии (название, роли пользователей)
        if (!$group->IsAdminRole()){
            return 0;
        }

        MoneyQuery::GroupUpdate($this->db, $groupid, $d);

        foreach ($d->roles as $role){
            $sRole = $group->roles->Get($role->u);
            if (empty($sRole)){
                MoneyQuery::GUserRoleAppend($this->db, $groupid, $role->u, $role->r);
            } else {
                MoneyQuery::GUserRoleUpdate($this->db, $groupid, $role->u, $role->r);
            }
        }
        for ($i = 0; $i < $group->roles->Count(); $i++){
            $sRole = $group->roles->GetByIndex($i);
            if ($sRole->id === Abricos::$user->id){
                continue; // свою роль удалить нельзя
            }
            $find = false;
            foreach ($d->roles as $role){
                if ($sRole->id === $role->u){
                    $find = true;
                    break;
                }
            }
            if (!$find){
                MoneyQuery::GUserRoleRemove($this->db, $groupid, $sRole->id);
            }
        }

        return 0;
    }

    public function AccountSaveToJSON($d){
        $res = $this->AccountSave($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        $ret = $this->FullDataToJSON();
        $ret->accountSave = $res;

        return $ret;
    }

    public function AccountSave($d){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }
        $d = $this->AccountSaveDataParse($d);
        if ($d->id > 0){
            $account = $this->AccountList()->Get($d->id);
            if (!$account || !$account->IsAdminRole()){
                return 403;
            }
            $this->AccountUpdateMethod($d);
        } else {
            $group = $this->GroupList()->Get($d->groupid);
            if (!$group || !$group->IsReadRole()){
                return 403;
            }
            $d->id = $this->AccountAppendMethod($group->id, $d);
        }

        $this->ClearCache();

        $ret = new stdClass();
        $ret->accountid = $d->id;
        return $ret;
    }

    private function AccountSaveDataParse($d){
        $fps = Abricos::TextParser(true);

        $d->id = intval($d->id);
        $d->groupid = intval($d->groupid);
        $d->initbalance = doubleval($d->initbalance); // start balance
        $d->title = $fps->Parser($d->title); // title
        $d->descript = $fps->Parser($d->descript); // descript
        $d->type = intval($d->type); // account type
        $d->currency = $fps->Parser($d->currency); // currency

        return $d;
    }

    private function AccountAppendMethod($groupid, $d){
        $d = $this->AccountSaveDataParse($d);

        $userid = Abricos::$user->id;

        $d->id = MoneyQuery::AccountAppend($this->db, $userid, $groupid, $d);

        foreach ($d->roles as $r){
            MoneyQuery::AUserRoleAppend($this->db, $d->id, $r->u, $r->r);
        }

        MoneyQuery::AccountUpdateBalance($this->db, $d->id);

        return $d->id;
    }

    private function AccountUpdateMethod($d){
        $d = $this->AccountSaveDataParse($d);

        $accountid = $d->id;
        $account = $this->AccountList()->Get($accountid);

        MoneyQuery::AccountUpdate($this->db, $accountid, $d);

        // обновление ролей доступа к аккаунтам
        foreach ($d->roles as $role){
            $sRole = $account->roles->Get($role->u);
            if (empty($sRole)){
                MoneyQuery::AUserRoleAppend($this->db, $accountid, $role->u, $role->r);
            } else {
                MoneyQuery::AUserRoleUpdate($this->db, $accountid, $role->u, $role->r);
            }
        }

        for ($i = 0; $i < $account->roles->Count(); $i++){
            $sRole = $account->roles->GetByIndex($i);
            if ($sRole->id === Abricos::$user->id){
                continue; // свою роль удалить нельзя
            }
            $find = false;
            foreach ($d->roles as $role){
                if ($sRole->id === $role->u){
                    $find = true;
                    break;
                }
            }
            if (!$find){
                MoneyQuery::AUserRoleRemove($this->db, $accountid, $sRole->id);
            }
        }
        MoneyQuery::AccountUpdateBalance($this->db, $accountid);
    }

    public function AccountRemoveToJSON($d){
        $res = $this->AccountRemove($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        $ret = $this->FullDataToJSON();
        $ret->accountRemove = $res;

        return $ret;
    }

    public function AccountRemove($d){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }
        $accountid = intval($d->id);
        $account = $this->AccountList()->Get($accountid);
        if (empty($account) || !$account->IsAdminRole()){
            return 403;
        }
        MoneyQuery::AccountRemove($this->db, $accountid);

        $this->ClearCache();

        $ret = new stdClass();
        $ret->accountid = $accountid;
        return $ret;
    }


    public function UserListToJSON(){
        $res = $this->UserList();
        return $this->ResultToJSON('userList', $res);
    }

    public function UserList(){
        if (isset($this->_cache['UserList'])){
            return $this->_cache['UserList'];
        }
        if (!$this->manager->IsViewRole()){
            return 403;
        }

        $userIds = array();
        $list = $this->GroupList();
        for ($i = 0; $i < $list->Count(); $i++){
            $userIds += $list->GetByIndex($i)->roles->ToArray('id');
        }

        $list = $this->AccountList();
        for ($i = 0; $i < $list->Count(); $i++){
            $userIds += $list->GetByIndex($i)->roles->ToArray('id');
        }

        $list = $this->models->InstanceClass('UserList');
        $rows = MoneyQuery::UserListByIds($this->db, $userIds);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('User', $d));
        }
        return $this->_cache['UserList'] = $list;
    }

    private $_fullParser = null;

    private function CategoryAppendMethod($groupid, $title, $isExpense, $parentid = 0, $order = 0){
        if (empty($this->_fullParser)){
            $this->_fullParser = Abricos::TextParser(true);
        }
        $parser = $this->_fullParser;
        $title = $parser->Parser($title);
        $isExpense = !empty($isExpense) ? 1 : 0;
        return MoneyQuery::CategoryAppend($this->db, Abricos::$user->id, $groupid, $title, $isExpense, $parentid, $order);
    }

    public function CategorySaveToJSON($d){
        $res = $this->CategorySave($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }
        return $this->ImplodeJSON(array(
            $this->GroupListToJSON()
        ), $res);
    }

    public function CategorySave($d){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }

        $fps = Abricos::TextParser(true);
        $d->id = intval($d->id);
        $d->isexpense = !empty($d->isexpense) ? 1 : 0;
        $d->groupid = intval($d->groupid);
        $d->parentid = intval($d->parentid);
        $d->title = $fps->Parser($d->title);

        $group = $this->GroupList()->Get($d->groupid);
        if (empty($group) || !$group->IsWriteRole()){
            return 403;
        }

        if (!empty($d->parentid)){
            $parentCategory = $group->categories->Get($d->parentid);
            if (empty($parentCategory)){
                return 403;
            }
        }

        if ($d->id === 0){
            $d->id = MoneyQuery::CategoryAppend($this->db, Abricos::$user->id,
                $d->groupid, $d->title, $d->isexpense, $d->parentid, 0);
        } else {
            MoneyQuery::CategoryUpdate($this->db, $d->groupid, $d->id, $d->title);
        }

        $this->ClearCache();
        $ret = new stdClass();
        $ret->categoryid = $d->id;

        return $ret;
    }

    public function CategoryRemoveToJSON($d){
        $res = $this->CategoryRemove($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        return $this->ImplodeJSON(array(
            $this->GroupListToJSON()
        ), $res);
    }

    /**
     * @param $group MoneyGroup
     * @param $categoryid
     */
    private function CategoryRemoveMethod($group, $categoryid){
        $count = $group->categories->Count();
        for ($i = 0; $i < $count; $i++){
            $category = $group->categories->GetByIndex($i);
            if ($category->parentid === $categoryid){
                $this->CategoryRemoveMethod($group, $category->id);
            }
        }

        MoneyQuery::CategoryRemove($this->db, $group->id, $categoryid);
        MoneyQuery::OperRemoveByCategoryId($this->db, $categoryid);
    }

    public function CategoryRemove($d){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }

        $d->id = intval($d->id);
        $d->groupid = intval($d->groupid);

        $group = $this->GroupList()->Get($d->groupid);
        if (empty($group) || !$group->IsWriteRole()){
            return 403;
        }
        $this->CategoryRemoveMethod($group, $d->id);

        $accountList = $this->AccountList();
        for ($i = 0; $i < $accountList->Count(); $i++){
            MoneyQuery::AccountUpdateBalance($this->db, $accountList->GetByIndex($i)->id);
        }

        $this->ClearCache();

        $ret = new stdClass();
        $ret->categoryid = $d->id;

        return $ret;
    }

    private function CategoryInit($gid){
        $this->ClearCache();

        // TODO: необходимо завести таблицу базовых категорий для все создающихся бухгалтерий
        $ord = 1;
        $this->CategoryAppendMethod($gid, "Зарплата", false, 0, $ord++);
        $this->CategoryAppendMethod($gid, "Прочие доходы", false, 0, $ord++);

        $ord = 1;
        $id = $this->CategoryAppendMethod($gid, "Без категории", true, 0, $ord++);

        $id = $this->CategoryAppendMethod($gid, "Прочие расходы", true, 0, $ord++);
        $this->CategoryAppendMethod($gid, "Проезд", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Сотовая связь", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Разовые", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Праздник", true, $id, $ord++);

        $id = $this->CategoryAppendMethod($gid, "Еда и продукты", true, 0, $ord++);
        $this->CategoryAppendMethod($gid, "Молочное", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Фрукты, овощи", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Мясо, колбасы", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Обеды, перекусы", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Крупы, хлеб и т.д.", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "К чаю, сладкое", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Напитки", true, $id, $ord++);

        $id = $this->CategoryAppendMethod($gid, "Дом", true, 0, $ord++);
        $this->CategoryAppendMethod($gid, "Комунальные платежи", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Дети", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Животные", true, $id, $ord++);

        $id = $this->CategoryAppendMethod($gid, "Автомобиль", true, 0, $ord++);
        $this->CategoryAppendMethod($gid, "Бензин", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Запчасти, ремонт", true, $id, $ord++);

        $id = $this->CategoryAppendMethod($gid, "Одежда", true, 0, $ord++);
        $this->CategoryAppendMethod($gid, "Обувь", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Летняя", true, $id, $ord++);
        $this->CategoryAppendMethod($gid, "Зимняя", true, $id, $ord++);
    }

    public function OperListToJSON($config){
        $res = $this->OperList($config);
        $ret = $this->ResultToJSON('operList', $res);
        $ret->operListConfig = $config;
        return $ret;
    }

    /**
     * @param $config
     * @return MoneyOperList
     */
    public function OperList($config){
        if (!$this->manager->IsViewRole()){
            return 403;
        }
        $accountList = $this->AccountList();
        $aids = array();
        for ($i = 0; $i < $accountList->Count(); $i++){
            $account = $accountList->GetByIndex($i);
            if ($config->groupid === $account->groupid){
                array_push($aids, $account->id);
            }
        }
        $fromdt = $config->period[0];
        $enddt = $config->period[1];
        $upddate = isset($config->upddate) ? $config->upddate : 0;

        $list = $this->models->InstanceClass('OperList');

        $rows = MoneyQuery::OperListByAIds($this->db, $aids, $fromdt, $enddt, $upddate);
        while (($d = $this->db->fetch_array($rows))){
            $list->Add($this->models->InstanceClass('Oper', $d));
        }
        return $list;
    }
}

?>