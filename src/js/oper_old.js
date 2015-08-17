var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: 'widget', files: ['calendar.js']},
        {name: '{C#MODNAME}', files: ['opermove.js']}
    ]
};
Component.entryPoint = function(NS){

    var OperEditorWidget = function(container, account, isExpense){
        this.init(container, account, isExpense);
    };
    OperEditorWidget.prototype = {

        onCategoriesChanged: function(){
            this.catsWidget.render();
            this.hideCreateCategory();
        },

        onClick: function(el){
            var tp = this._TId['editor'];
            switch (el.id) {
                case tp['bcreate']:
                    this.save();
                    return false;
                case tp['bsave']:
                    this.save();
                    return false;
                case tp['bcancel']:
                    this.setOper(null);
                    return false;
            }
            return false;
        },
        onKeyPress: function(el, e){
            if (e.keyCode == 13 && el.id == this._TM.getElId('editor.in')){
                this.save();
            }
            return false;
        }
    };
    NS.OperEditorWidget = OperEditorWidget;

    var OperationWidget = function(container, account){
        this.init(container, account);
    };
    OperationWidget.prototype = {

        setAccount: function(acc){
            this.account = acc;
            for (var n in this.tabs){
                this.tabs[n].setAccount(acc);
            }
        },

    };
    NS.OperationWidget = OperationWidget;
};