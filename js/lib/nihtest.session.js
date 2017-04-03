const TestSession = (function(){

	const defaults = {
		name: ""
	};

	function create(options){
		const testSession = {};
		testSession.options = Object.assign({}, defaults, options);
		bind(testSession);
		testSession.init();
		return testSession;
	}

	function bind(testSession){
		testSession.init = init.bind(testSession);
		testSession.test = test.bind(testSession);
	}

	function init(){
		this.name = this.options.name;
		this.successCount = 0;
		this.failCount = 0;
		this.tests = [];
	}

	function test(name, testFunc){
		const test = Test.create({
			name,
			func : testFunc
		});
		this.tests.push(test);
		testFunc(test);
	}

	return {
		create
	};

})();
