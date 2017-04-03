const NihTest = (function(){

	function testSession(name, sessionFunc){
		const session = TestSession.create({ name });
		sessionFunc(session);
		const reporter = TestReporter.create();
		let html = reporter.report(session);
		document.body.innerHTML = html;
	}

	return {
		testSession
	};

})();