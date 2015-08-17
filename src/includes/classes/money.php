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
    }

    public function AJAX($d){
        switch ($d->do){
            case "appStructure":
                return $this->AppStructureToJSON();
            case 'accountList':
                return $this->AccountListToJSON();
            case 'groupList':
                return $this->GroupListToJSON();
            case 'groupSave':
                return $this->GroupSaveToJSON($d->group);
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

        $res = $modelManager->ToJSON('Group,Category,CategoryList,UserRole,UserRoleList,Account,AccountUserRole,GroupUserRole,User');
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

        $accountIds = $list->ToArray('id');

        $rows = MoneyQuery::AUserRoleListByAId($this->db, $accountIds);
        while (($d = $this->db->fetch_array($rows))){
            $account = $list->Get($d['accountid']);
            if (empty($account)){
                continue;
            }
            $account->roles->Add($this->models->InstanceClass('UserRole', $d));
        }

        return $this->_cacheAccountList = $list;
    }

    public function GroupListToJSON(){
        $res = $this->GroupList();
        return $this->ResultToJSON('groupList', $res);
    }

    private $_cacheGroupList;

    /**
     * @return MoneyGroupList
     */
    public function GroupList(){
        if (isset($this->_cacheGroupList)){
            return $this->_cacheGroupList;
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

        return $this->_cacheGroupList = $list;
    }

    public function GroupSaveToJSON($d){
        $res = $this->GroupSave($d);
        if (is_integer($res)){
            $ret = new stdClass();
            $ret->err = $res;
            return $ret;
        }

        return $res;
    }

    public function GroupSave($d){
        if (!$this->manager->IsWriteRole()){
            return 403;
        }

        $parser = Abricos::TextParser(true);
        $d->id = intval($d->id);
        $d->title = $parser->Parser($d->title);

        if ($d->id === 0){
            $d->id = MoneyQuery::GroupAppend($this->db, $this->userid, $d);

            // добавление ролей
            foreach ($d->roles as $r){
                MoneyQuery::GUserRoleAppend($this->db, $d->id, $r->u, $r->r);
            }
            $this->CategoryInit($d->id);
        } else {
            $groupList = $this->GroupList();
            $group = $groupList->Get($d->id);

            if (empty($group)){
                return 500;
            }

            $role = $this->GroupUserRoleList()->Get($d->id);

            if (!empty($role) && $role->role === MoneyAccountRole::ADMIN){

                // Только админ может: изменять данные по бухгалтерии (название, роли пользователей)
                MoneyQuery::GroupUpdate($this->db, $d->id, $d);

                $rows = MoneyQuery::GUserRoleListByGId($this->db, array($d->id));

                $dbRoles = $this->ToArrayId($rows, "u");
                foreach ($d->roles as $role){
                    if (empty($dbRoles[$role->u])){
                        MoneyQuery::GUserRoleAppend($this->db, $d->id, $role->u, $role->r);
                    } else {
                        MoneyQuery::GUserRoleUpdate($this->db, $d->id, $role->u, $role->r);
                    }
                }

                foreach ($dbRoles as $dbRole){
                    $find = false;
                    foreach ($d->roles as $role){
                        if ($dbRole['u'] == $role->u){
                            $find = true;
                        }
                    }
                    if (!$find && $this->userid != $dbRole['u']){ // свою роль удалить нельзя
                        MoneyQuery::GUserRoleRemove($this->db, $d->id, $dbRole['u']);
                    }
                }
            }
        }


        $ret = new stdClass();
        $ret->groupid = $d->id;


        $ret->src = $d;
        return $ret;
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
        return $this->_cacheUserList = $list;
    }


    private function CategoryInit($gid){
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

}

?>