const TestReporter = (function(){

	const defaults = {};

	function create(options){
		const testReporter = {};
		testReporter.options = Object.assign({}, defaults, options);
		bind(testReporter);
		return testReporter;
	}

	function bind(testReporter){
		testReporter.report = report.bind(testReporter);
		testReporter.reportTest = reportTest.bind(testReporter);
		testReporter.reportAssertion = reportAssertion.bind(testReporter);
	}

	function report(session){
		let html = "<ul class='tests'>";
		for(let i = 0; i < session.tests.length; i++){
			html += this.reportTest(session.tests[i]);
		}
		html += "</ul>";
		return html;
	}

	function reportTest(test){
		const ok = test.assertions.every(a => a.expected === a.value);
		let html = `<li class='test ${ok ? "success" : "error"}'>`;
		for(let i = 0; i < test.assertions.length; i++){
			html += reportAssertion(test.assertions[i]);
		}
		html += "</li>";
		return html;
	}

	function reportAssertion(assertion){
		let ok = assertion.expected === assertion.value;
		let resultText = ok ? "Ok!" : `Expected: ${assertion.expected}, but was ${assertion.value}`;
		return `
			<div class='assertion ${ok ? "success" : "error"}'>"
				<strong>${ok ? "Success" : "Failed"}:</strong>
				<span>${assertion.description}. </span>
				<span>${resultText}<span>
			</div>
		`;
	}

	return {
		create
	};

})();
