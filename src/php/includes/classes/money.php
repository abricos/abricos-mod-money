<?php

require_once 'structure.php';

class MoneyManager {

    /**
     * @var MoneyModuleManager
     */
    public $manager;

    /**
     * @var Ab_Database
     */
    public $db;

    public function __construct(MoneyModuleManager $manager) {
        $this->manager = $manager;
        $this->db = $manager->db;
    }

    public function AJAX($d) {

        switch ($d->do) {

            case 'accountList':
                return $this->AccountListToAJAX();

        }

        return null;
    }


    public function AccountListToAJAX() {
        $list = $this->AccountList();
        if (empty($list)){
            return 403;
        }
        $ret = new stdClass();
        $ret->accountList = $list->ToAJAX();
        return $ret;
    }

    public function AccountList() {
        if (!$this->manager->IsViewRole()) {
            return null;
        }

        $list = new MoneyAccountList();
        $rows = MoneyQuery::AccountList($this->db, Abricos::$user->id);

        while (($d = $this->db->fetch_array($rows))) {
            $list->Add(new MoneyAccount($d));
        }
        return $list;
    }

}

?>