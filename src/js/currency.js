var Component = new Brick.Component();
Component.requires = {
    mod: [
        {name: '{C#MODNAME}', files: ['lib.js']}
    ]
};
Component.entryPoint = function(NS){
    var Y = Brick.YUI,
        COMPONENT = this,
        SYS = Brick.mod.sys;

    NS.CurrencySelectWidget = Y.Base.create('currencySelectWidget', SYS.AppWidget, [], {
        onInitAppWidget: function(err, appInstance, options){
            var tp = this.template, lst = "";
            NS.currencyList.each(function(currency){
                lst += tp.replace('row', currency.toJSON());
            });
            var el = Y.one(tp.gel('id'));
            el.setHTML(lst);
            if (options && options.arguments && options.arguments[0] && options.arguments[0].selected){
                this.set('selected', options.arguments[0].selected);
            }
        }
    }, {
        ATTRS: {
            component: {value: COMPONENT},
            templateBlockName: {value: 'select,row'},
            selected: {
                value: Abricos.config.locale === 'ru-RU' ? 'RUB' : 'USD',
                setter: function(val){
                    var el = Y.one(this.template.gel('id'));
                    if (!el){
                        return;
                    }
                    el.set('value', val);
                    return val;
                },
                getter: function(){
                    var el = Y.one(this.template.gel('id'));
                    if (!el){
                        return;
                    }
                    return el.get('value');
                }
            },
            mode: {
                value: 0 // 0 - сокращение, 1 - название, 2 - код+название
            }
        }
    });

};