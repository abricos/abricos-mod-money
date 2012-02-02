/*
@version $Id$
@package Abricos
@copyright Copyright (C) 2008 Abricos All rights reserved.
@license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
*/

var Component = new Brick.Component();
Component.requires = { 
	mod:[
        {name: 'sys', files: ['widgets.js']},
        {name: 'widget', files: ['period.js']},
        {name: '{C#MODNAME}', files: ['category.js']}
	]		
};
Component.entryPoint = function(NS){

	var Dom = YAHOO.util.Dom,
		E = YAHOO.util.Event,
		L = YAHOO.lang;

	var DM = YAHOO.widget.DateMath;
	
	var buildTemplate = this.buildTemplate;
	
	var OperListWidget = function(container, group, cfg){
		cfg = L.merge({
			
		}, cfg || {});
		this.init(container, group, cfg);
	};
	OperListWidget.prototype = {
		init: function(container, group, cfg){
			this.group = group;
			this.opers = new NS.OperList();
			this.cfg = cfg;
			
			var TM = buildTemplate(this, 'list,table,row,rowtdbase,rowtdmove,rowsum,rbtns,rbtnsn');
			container.innerHTML = TM.replace('list');
			
			this.paginator = new YAHOO.widget.Paginator({
				containers : TM.getEl('list.pagtop'), 
				rowsPerPage: 15
			});
			this.paginator.subscribe('changeRequest', this.onPaginatorChanged, this, true);
			
			this._savedHeight = 20;
			
			var __self = this;
			E.on(container, 'click', function(e){
                var el = E.getTarget(e);
                if (__self.onClick(el)){ E.preventDefault(e); }
            });
		},
		destroy: function(){},
		onClick: function(el){
			
			var TId = this._TId,
				prefix = el.id.replace(/([0-9]+$)/, ''),
				numid = el.id.replace(prefix, "");
			
			switch(prefix){
			case TId['rbtns']['bedit']+'-':
				this.onClickEdit(this.opers.get(numid));
				return true;
			case TId['rbtns']['bremove']+'-':
				this.onClickRemove(this.opers.get(numid));
				return true;
			}

			return false;
		},
		onClickEdit: function(oper){},
		onClickRemove: function(oper){},
		setOpers: function(opers){
			this.opers = opers;
			
			var param = { page: 1, totalRecords: (opers.count()-opers.methods.count()) };
			this.paginator.setState(param);
			this.paginator.render();
			
			this.render();
		},
		onPaginatorChanged: function(state){
			this.paginator.setState({'page': state.page});
			this.paginator.render();
			this.render();
		},
		render: function(){
			var TM = this._TM, lst = "", MM = NS.moneyManager, sum = {};
			
			var pgst = this.paginator.getState(),
				index = 0, fromrec = 0, endrec = 14,
				group = this.group;
			
			if (!L.isNull(pgst['records'])){
				fromrec = pgst['records'][0];
				endrec = pgst['records'][1];
			}
			
			var opers = this.opers, dmets = {};
			
			opers.foreach(function(oper){
				
				if (oper.methodid > 0){
					if (dmets[oper.methodid]){ return; }
					dmets[oper.methodid] = true;
				}
				
				if (index < fromrec){
					index++;
					return;
				}else if(index >= fromrec+15){
					return true;
				}

				var account = MM.findAccount(oper.accountid),
					cat = group.categories.get(oper.categoryid),
					val = oper.getValue(),
					ccid = account.currency.id;
				
				var std = "";
				if (oper.methodid == 0){
					if (!sum[ccid]){
						sum[ccid] = 0;
					}
					sum[ccid] += val;
					
					std = TM.replace('rowtdbase', {
						'expcls': oper.isExpense ? 'red' : 'green',
						'tp': oper.isExpense ? '-' : '+',
						'v': NS.numberFormat(val),
						'cc': account.currency.sign,
						'acc': L.isNull(account) ? '' : account.getTitle(),
						'cat': L.isNull(cat) ? '' : cat.title
					});
				}else{
					
					var opMove = opers.methods.get(oper.methodid),
						fAcc = MM.findAccount(opMove.fromAccountId),
						tAcc = MM.findAccount(opMove.toAccountId);

					std = TM.replace('rowtdmove', {
						'facc': L.isNull(fAcc) ? '' : fAcc.getTitle(),
						'tacc': L.isNull(tAcc) ? '' : tAcc.getTitle(),
						'cc': account.currency.sign,
						'v': NS.numberFormat(Math.abs(val))
					});
				}
				
				lst += TM.replace('row', {
					'id': oper.id,
					'd': Brick.dateExt.convert(oper.date.getTime()/1000, 0, true),
					'dsc': oper.descript,
					'btns': TM.replace(account.isOperRole() ? 'rbtns' : 'rbtnsn', {
						'id': oper.id
					}),
					'td': std
				});
				index++;
			});
			
			var first = true;
			for(var n in sum){
				var val = sum[n];
				lst += TM.replace('rowsum', {
					'first': first ? 'first' : '',
					'expcls': val < 0 ? 'red' : 'green',
					'v': NS.numberFormat(val),
					'cc': NS.currencyList.get(n).sign
				});
				first = false;
			}
			
			var elTable = TM.getEl('list.table');
			elTable.innerHTML = TM.replace('table', {'rows': lst});
			
			var rg = Dom.getRegion(elTable);
			
			var h = this._savedHeight = Math.max(this._savedHeight, rg.height);
			Dom.setStyle(elTable, 'min-height', h+'px');
		}
	};
	NS.OperListWidget = OperListWidget;
	
	var OperLogWidget = function(container, group){
		this.init(container, group);
	};
	OperLogWidget.prototype = {
		init: function(container, group){
			this.group = group;
			var TM = buildTemplate(this, 'widget');
			container.innerHTML = TM.replace('widget');
			
			this.listWidget = new NS.OperListWidget(TM.getEl('widget.list'), group);
			
			var __self = this;
			this.listWidget.onClickEdit = function(oper){
				__self.onRowClickEdit(oper);
			};
			this.listWidget.onClickRemove = function(oper){
				__self.onRowClickRemove(oper);
			};
			
			var edt = new Date(),
				fdt = DM.add(edt, DM.DAY, -7);
			
			fdt = new Date(fdt.getFullYear(), fdt.getMonth(), fdt.getDate(), 0, 0);
			edt = new Date(edt.getFullYear(), edt.getMonth(), edt.getDate(), 23, 59);

			this.opers = null;

			NS.moneyManager.balanceChangedEvent.subscribe(this.onBalanceChanged, this, true);

			this.periodWidget = new Brick.mod.widget.PeriodWidget(TM.getEl('widget.period'));
			this.periodWidget.periodChangedEvent.subscribe(this.onPeriodChanged, this, true);
			
			this.periodWidget.selectType('week');
		},
		destroy: function(){
			NS.moneyManager.balanceChangedEvent.unsubscribe(this.onBalanceChanged);
			this.periodWidget.periodChangedEvent.unsubscribe(this.onPeriodChanged);
		},
		onRowClickEdit: function(oper){},
		onRowClickRemove: function(oper){},
		onPeriodChanged: function(){
			var pd = this.periodWidget.getValue();
			this.setPeriod(pd['fdt'], pd['edt']);
		},
		onBalanceChanged: function(e, prm){
			var acc = prm[0],
				byRemoveOper = prm[1];
			if (L.isNull(acc)){ return; }
			
			if (byRemoveOper){
				this.opers = null;
			}
			this.loadPeriod();
		},
		setPeriod: function(fromdt, enddt){
			this.fromdt = fromdt;
			this.enddt = enddt;
			this.opers = null;
			this.loadPeriod();
		},
		updateOpers: function(opers){
			this.opers = opers;
			this.listWidget.setOpers(opers);
		},
		loadPeriod: function(){
			var __self = this, TM=this._TM,
				fromdt = this.fromdt, enddt = this.enddt, 
				copers = this.opers;
			
			Dom.setStyle(TM.getEl('widget.loading'), 'display', '');
			NS.moneyManager.operLogLoad(this.group.id, fromdt, enddt, copers, function(opers){
				Dom.setStyle(TM.getEl('widget.loading'), 'display', 'none');
				__self.updateOpers(opers);
			});
		}
	};
	NS.OperLogWidget = OperLogWidget;
};