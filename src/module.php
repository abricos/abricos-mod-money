<?php
/**
 * @package Abricos
 * @subpackage Money
 * @copyright Copyright (C) 2011 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@abricos.org)
 */


/**
 * Модуль Финансы
 */
class MoneyModule extends Ab_Module {

    private $_manager;

    /**
     * Конструктор
     */
    public function __construct() {
        $this->version = "0.2.0";
        $this->name = "money";
        $this->takelink = "money";
        $this->permission = new MoneyPermission($this);
    }

    /**
     * @return MoneyManager
     */
    public function GetManager() {
        if (!isset($this->_manager)) {
            require_once 'includes/manager.php';
            $this->_manager = new MoneyManager($this);
        }
        return $this->_manager;
    }

    public function GetContentName() {
        return 'index';
    }

    /*
    public function GetAppSourceInfo(){
        $appInfo = new AppSourceInfo($this);

        $appInfo->resource->Add("/modules/money/images/logo-96x96.png");
        $appInfo->resource->Add("/modules/money/images/app_icon.png");

        return $appInfo;
    }
    /**/

    public function Bos_IsMenu() {
        return true;
    }
}

class MoneyAccountRole {
    const ACCESSDENIED = 0;
    const READ = 1;
    const WRITE = 2;
    const ADMIN = 3;
}

class MoneyAction {
    const VIEW = 10;
    const WRITE = 30;
    const ADMIN = 50;
}

class MoneyPermission extends Ab_UserPermission {

    public function MoneyPermission(MoneyModule $module) {
        // объявление ролей по умолчанию
        // используется при инсталяции модуля в платформе
        $defRoles = array(
            new Ab_UserRole(MoneyAction::VIEW, Ab_UserGroup::GUEST),
            new Ab_UserRole(MoneyAction::VIEW, Ab_UserGroup::REGISTERED),
            new Ab_UserRole(MoneyAction::VIEW, Ab_UserGroup::ADMIN),

            new Ab_UserRole(MoneyAction::WRITE, Ab_UserGroup::REGISTERED),
            new Ab_UserRole(MoneyAction::WRITE, Ab_UserGroup::ADMIN),

            new Ab_UserRole(MoneyAction::ADMIN, Ab_UserGroup::ADMIN)
        );
        parent::__construct($module, $defRoles);
    }

    public function GetRoles() {
        return array(
            MoneyAction::VIEW => $this->CheckAction(MoneyAction::VIEW),
            MoneyAction::WRITE => $this->CheckAction(MoneyAction::WRITE),
            MoneyAction::ADMIN => $this->CheckAction(MoneyAction::ADMIN)
        );
    }
}

// создать экземляр класса модуля и зарегистрировать его в ядре 
Abricos::ModuleRegister(new MoneyModule());

?>