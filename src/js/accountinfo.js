var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['userrole.js']}
    ]
};
Component.entryPoint = function(NS){

    var Dom = YAHOO.util.Dom,
        E = YAHOO.util.Event,
        L = YAHOO.lang;

    var LNG = this.language, buildTemplate = this.buildTemplate;

    var AccountInfoWidget = function(container, account){
        this.init(container, account);
    };
    AccountInfoWidget.prototype = {
        init: function(container, account){
            this.rolesWidget = null;

            var TM = buildTemplate(this, 'widget');
            container.innerHTML = TM.replace('widget');

            var __self = this;
            E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){
                    E.preventDefault(e);
                }
            });
            this.setAccount(account);

            NS.moneyManager.balanceChangedEvent.subscribe(this.onAccountChanged, this, true);
            NS.moneyManager.accountChangedEvent.subscribe(this.onAccountChanged, this, true);
        },
        destroy: function(){
            NS.moneyManager.balanceChangedEvent.unsubscribe(this.onAccountChanged);
            NS.moneyManager.accountChangedEvent.unsubscribe(this.onAccountChanged);
            var el = this._TM.getEl('widget.id');
            el.parentNode.removeChild(el);
        },
        onClick: function(el){
            if (!L.isNull(this.rolesWidget)){
                if (this.rolesWidget.onClick(el)){
                    return true;
                }
            }
            var tp = this._TId['widget'];
            switch (el.id) {
            }
            return false;
        },
        onAccountChanged: function(){
            this.render();
        },
        setAccount: function(acc){
            this.account = acc;
            this.render();
        },
        render: function(){
            var acc = this.account;
            var TM = this._TM,
                gel = function(n){
                    return TM.getEl('widget.' + n);
                };

            gel('tl').innerHTML = acc.getTitle();
            gel('dsc').innerHTML = acc.descript;
            Dom.setStyle(gel('dsc'), 'display', acc.descript ? '' : 'none');

            if (!L.isNull(this.rolesWidget)){
                this.rolesWidget.destroy();
            }

            this.rolesWidget = new NS.RoleListWidget(gel('roles'), acc.roles, {
                'readonly': true
            });

            gel('cc').innerHTML = acc.currency.sign;

            var elv = gel('bc');
            elv.innerHTML = NS.numberFormat(acc.balance);
            if (acc.balance >= 0){
                Dom.replaceClass(elv, 'red', 'green');
            } else {
                Dom.replaceClass(elv, 'green', 'red');
            }
        }
    };
    NS.AccountInfoWidget = AccountInfoWidget;
};