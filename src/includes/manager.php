<?php
/**
 * @package Abricos
 * @subpackage Money
 * @copyright 2011-2015 Alexander Kuzmin
 * @license http://opensource.org/licenses/mit-license.php MIT License
 * @author Alexander Kuzmin <roosit@abricos.org>
 */


/**
 * Class MoneyManager
 *
 * @method MoneyApp GetApp()
 */
class MoneyManager extends Ab_ModuleManager {

    /**
     * @var MoneyModule
     */
    public $module = null;

    /**
     * @var MoneyManager
     */
    public static $instance = null;

    public function __construct(MoneyModule $module){
        parent::__construct($module);

        MoneyManager::$instance = $this;
    }

    public function IsAdminRole(){
        return $this->IsRoleEnable(MoneyAction::ADMIN);
    }

    public function IsWriteRole(){
        if ($this->IsAdminRole()){
            return true;
        }
        return $this->IsRoleEnable(MoneyAction::WRITE);
    }

    public function IsViewRole(){
        if ($this->IsWriteRole()){
            return true;
        }
        return $this->IsRoleEnable(MoneyAction::VIEW);
    }

    public function AJAX($d){
        return $this->GetApp()->AJAX($d);
    }

    public function Bos_MenuData(){
        if (!$this->IsViewRole()){
            return null;
        }
        $i18n = $this->module->I18n();
        return array(
            array(
                "name" => "money",
                "group" => "personal",
                "title" => $i18n->Translate('bosmenu.title'),
                "icon" => "/modules/money/images/money-24.png",
                "url" => "money/wspace/ws/"
            )
        );
    }

    public function Bos_SummaryData(){
        if (!$this->IsViewRole()){
            return null;
        }
        $i18n = $this->module->I18n();
        return array(
            array(
                "module" => "money",
                "component" => "summary",
                "widget" => "SummaryWidget",
                "title" => $i18n->Translate('bosmenu.title')
            )
        );
    }
}
