const Test = (function(){

	const defaults = {
		name: ""
	};

	function create(options){
		const test = {};
		test.options = Object.assign({}, defaults, options);
		bind(test);
		test.init();
		return test;
	}

	function bind(test){
		test.init = init.bind(test);
		test.assertOk = assertOk.bind(test);
		test.assertNotOk = assertNotOk.bind(test);
	}

	function init(){
		this.name = this.options.name;
		this.assertions = [];
	}

	function assertOk(value, description){
		this.assertions.push({
			value,
			expected: true,
			description
		});
	}

	function assertNotOk(value, description){
		this.assertions.push({
			value,
			expected: false,
			description
		});
	}

	return {
		create
	};

})();
