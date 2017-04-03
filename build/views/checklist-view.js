const ChecklistView = (function() {

	const defaults = {
		model : null, //required
		root : null, //required
		template : null //required
	};

	function create(options) {
		const checklistView = {};
		checklistView.options = Object.assign({}, defaults, options);
		bind(checklistView);
		checklistView.init();
		return checklistView;
	}

	function bind(checklistView){
		checklistView.init = init.bind(checklistView);
		checklistView.setBndr = setBndr.bind(checklistView);
		checklistView.enableChanged = enableChanged.bind(checklistView);
	}

	function init(){
		this.setBndr();
	}

	function setBndr(){
		this.bndr = Bndr.create()
			.setTemplate(this.options.template)
			.setModel(this.options.model)
			.bindElement(".name", "name")
			.bindElementTwoWay("[type='checkbox']", "enabled")
			.bindChange("enabled", this.enableChanged)
			.attachTo(this.options.root);
		this.model = this.bndr.getBoundModel();
	}

	function enableChanged(){
		if(!this.model){
			return;
		}
		Dispatcher.globalDispatcher.trigger("checks-change", this.model.filter(x => x.enabled).map(x => x.name));
	}

	return {
		create
	};

})();
