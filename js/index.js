Testlib.testSession("Basic testing assertions", function(session){

	session.test("OK should get ok for true", function(test){
		test.assertOk(true, "This should have been ok");
	});

	session.test("OK should get failed for false", function(test){
		test.assertOk(false, "This should have been not ok");
	});

	session.test("NOT OK should get ok for false", function(test){
		test.assertNotOk(false, "This should have been ok");
	});

	session.test("NOT OK should get failed for true", function(test){
		test.assertNotOk(true, "This should have been not ok");
	});

});
