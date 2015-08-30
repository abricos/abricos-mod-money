<?php
/**
 * @package Abricos
 * @subpackage Money
 * @copyright Copyright (C) 2008 Abricos. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @author Alexander Kuzmin (roosit@Abricos.org)
 */

require_once 'dbquery.php';

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

    private $_money = null;

    /**
     * @return Money
     */
    public function GetMoney(){
        if (!is_null($this->_money)){
            return $this->_money;
        }
        require_once 'classes/money.php';
        $this->_money = new Money($this);
        return $this->_money;
    }

    public function AJAX($d){
        return $this->GetMoney()->AJAX($d);
    }

    public function OperRemove($operid){
        $dbOper = MoneyQuery::OperInfo($this->db, $operid);
        $dbAccount = MoneyQuery::Account($this->db, $this->userid, $dbOper['accountid']);
        if (empty($dbAccount) || $dbAccount['r'] < MoneyAccountRole::WRITE){
            return null;
        }

        MoneyQuery::OperRemove($this->db, $operid, $dbOper['accountid']);

        MoneyQuery::AccountUpdateBalance($this->db, $dbOper['accountid']);

        $account = MoneyQuery::Account($this->db, $this->userid, $dbOper['accountid']);
        $ret = new stdClass();
        $ret->balance = new stdClass();
        $ret->balance->accountid = $account['id'];
        $ret->balance->value = $account['bc'];
        return $ret;
    }

    public function Bos_MenuData(){
        if (!$this->IsViewRole()){
            return null;
        }
        $i18n = $this->module->I18n();
        return array(
            array(
                "name" => "money",
                "title" => $i18n->Translate('bosmenu.title'),
                "icon" => "/modules/money/images/money-24.png",
                "url" => "money/wspace/ws/"
            )
        );
    }

}

?>