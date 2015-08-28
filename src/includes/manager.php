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

    public function OperMoveRemove($methodid){
        $dbMOper = MoneyQuery::OperMoveInfo($this->db, $methodid);
        $dbFAccount = MoneyQuery::Account($this->db, $this->userid, $dbMOper['fromaccountid']);
        $dbTAccount = MoneyQuery::Account($this->db, $this->userid, $dbMOper['toaccountid']);

        if (empty($dbFAccount) || empty($dbTAccount) || $dbFAccount['r'] < MoneyAccountRole::WRITE || $dbTAccount['r'] < MoneyAccountRole::WRITE
        ){
            return null;
        }

        MoneyQuery::OperMoveRemove($this->db, $methodid);
        MoneyQuery::AccountUpdateBalance($this->db, $dbFAccount['id']);
        MoneyQuery::AccountUpdateBalance($this->db, $dbTAccount['id']);


        // TODO: Повторение кода, необходима оптимизация
        $account = MoneyQuery::Account($this->db, $this->userid, $dbFAccount['id']);
        $ret1 = new stdClass();
        $ret1->balance = new stdClass();
        $ret1->balance->accountid = $account['id'];
        $ret1->balance->value = $account['bc'];

        $account = MoneyQuery::Account($this->db, $this->userid, $dbTAccount['id']);
        $ret2 = new stdClass();
        $ret2->balance = new stdClass();
        $ret2->balance->accountid = $account['id'];
        $ret2->balance->value = $account['bc'];

        return array(
            $ret1,
            $ret2
        );
    }

    public function OperMoveSave($od){

        $dbFAccount = MoneyQuery::Account($this->db, $this->userid, $od->faid);
        $dbTAccount = MoneyQuery::Account($this->db, $this->userid, $od->taid);

        if (empty($dbFAccount) || empty($dbTAccount) || $dbFAccount['r'] < MoneyAccountRole::WRITE || $dbTAccount['r'] < MoneyAccountRole::WRITE || $dbFAccount['gid'] != $dbTAccount['gid']
        ){
            return null;
        }

        $fps = Abricos::TextParser(true);
        $od->dsc = $fps->Parser($od->dsc);
        $od->v = abs(doubleval($od->v));

        if ($od->id == 0){
            MoneyQuery::OperMoveAppend($this->db, $this->userid, $od);
        } else {
            $dbMOper = MoneyQuery::OperMoveInfo($this->db, $od->id);
            if (empty($dbMOper) || $dbMOper['fromaccountid'] != $dbFAccount['id'] || $dbMOper['toaccountid'] != $dbTAccount['id']
            ){
                // изменение счета невозможно в этой версии
                return null;
            }
            MoneyQuery::OperMoveUpdate($this->db, $od->id, $od);
        }

        MoneyQuery::AccountUpdateBalance($this->db, $od->faid);
        MoneyQuery::AccountUpdateBalance($this->db, $od->taid);

        $account = MoneyQuery::Account($this->db, $this->userid, $od->faid);
        $ret1 = new stdClass();
        $ret1->balance = new stdClass();
        $ret1->balance->accountid = $account['id'];
        $ret1->balance->value = $account['bc'];

        $account = MoneyQuery::Account($this->db, $this->userid, $od->taid);
        $ret2 = new stdClass();
        $ret2->balance = new stdClass();
        $ret2->balance->accountid = $account['id'];
        $ret2->balance->value = $account['bc'];

        return array(
            $ret1,
            $ret2
        );
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