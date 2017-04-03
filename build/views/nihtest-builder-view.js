const NihTestBuilderView = (function() {
	const modules = [
		"core",
		"test",
		"session",
		"assertions",
		"reporter",
	];

	function create() {
		const nihTestBuilderView = {};
		bind(nihTestBuilderView);
		nihTestBuilderView.init();
		return nihTestBuilderView;
	}

	function bind(nihTestBuilderView) {
		nihTestBuilderView.init = init.bind(nihTestBuilderView);
		nihTestBuilderView.setBndr = setBndr.bind(nihTestBuilderView);
		nihTestBuilderView.copy = copy.bind(nihTestBuilderView);
		nihTestBuilderView.download = download.bind(nihTestBuilderView);
		nihTestBuilderView.compileSource = compileSource.bind(nihTestBuilderView);
	}

	function setBndr() {
		let model = modules.reduce((s,x) => s[x] = true, {});
		model = Object.assign({}, model, {
			files: {},
			source: "",
			checks: modules.map(x => { return { name: x, enabled: true }})
		});

		this.bndr = Bndr.create()
			.setTemplate(document.body)
			.setModel(model)
			.bindEvent("#copy", "click", this.copy)
			.bindEvent("#download", "click", this.download)
			.bindEvent(Dispatcher.globalDispatcher, "checks-change", this.compileSource)
			.bindElement("#output", "source")
			.bindView("#types-checklist", "checks", ChecklistView, {
				template : document.querySelector("#checkbox-tmpl")
			})
			.attach();

		modules.forEach(x => this.bndr.bindElementReverse(`#${x}`, x));

		this.model = this.bndr.getBoundModel();
	}

	function init() {
		this.setBndr();

		fetchScripts(modules)
			.then(files => {
				this.model.files = files;
				this.compileSource(modules);
			});
	}

	function compileSource(enabledSources){
		let sources = "";
		let files = this.model && this.model.files ? this.model.files : {};
		for(let i = 0; i < enabledSources.length; i++){
			sources += files[enabledSources[i]];
		}
		this.model.source = sources;
	}

	function fetchScripts(modules) {
		let files = {};
		let promises = [];
		for (let i = 0; i < modules.length; i++) {
			let request = fetch(`js/lib/nihtest.${modules[i]}.js`).then(x => x.text()).then(x => files[modules[i]] = x);
			promises.push(request);
		}
		return Promise.all(promises).then(() => files);
	}

	function copy() {
		Util.copy(document.querySelector("#output"));
	}

	function download() {
		let dataUri = Util.stringToDataUri(this.model.source);
		Util.download(dataUri, "nihtest.js");
	}

	return {
		create
	};
})();
