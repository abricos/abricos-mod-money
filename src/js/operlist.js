Component.entryPoint = function(NS){

    var DM = YAHOO.widget.DateMath;

    OperListWidget.prototype = {
        setOpers: function(opers){
            this.opers = opers;

            this.pagTop.setState({'page': 1});
            this.pagTop.render();

            this.render();
        },
    };
    NS.OperListWidget = OperListWidget;

    OperLogWidget.prototype = {
        onRowClickAction: function(action, oper){
            switch (action) {
                case 'edit':
                    this.onRowClickEdit(oper);
                    break;
                case 'remove':
                    this.onRowClickRemove(oper);
                    break;
                case 'filterdate':
                    this.addFilter('date', oper);
                    break;
                case 'filtertype':
                    this.addFilter('type', oper);
                    break;
                case 'filteraccount':
                    this.addFilter('account', oper);
                    break;
                case 'filtercategory':
                    this.addFilter('category', oper);
                    break;
            }
        },
        onBalanceChanged: function(e, prm){
            var acc = prm[0],
                byRemoveOper = prm[1];
            if (L.isNull(acc)){
                return;
            }

            if (byRemoveOper){
                this.opers = null;
            }
            this.loadPeriod();
        },
        updateOpers: function(opers){
            this.opers = opers;
            this.listWidget.setOpers(opers);
        },
    };
    NS.OperLogWidget = OperLogWidget;
};