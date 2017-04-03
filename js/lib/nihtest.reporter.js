const NihTestReporter = (function(){

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
		return `
			<h1>${session.name}</h1>
			${session.tests.reduce((html, t) => html + reportTest(t), "")}
		`;
	}

	function reportTest(test){
		const ok = test.assertions.every(NihTestAssertions.assertionPassed);
		return `
			<h2>${test.name}</h2>
			<div class='test ${ok ? "success" : "error"}'>
				${test.assertions.reduce((html,a) => html + reportAssertion(a), "")}
			</div>
		`;
	}

	function reportAssertion(assertion){
		let ok = NihTestAssertions.assertionPassed(assertion);
		const resultText = ok ? "Ok!" : `Expected: ${assertion.expected}, but was ${assertion.value}`;
		return `
			<div class='assertion ${ok ? "success" : "error"}'>
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
