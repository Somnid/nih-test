NihTest.testSession("Basic testing assertions", function(session){

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

	session.test("EQUAL should get ok if equal", function(test){
		test.assertEqual(false, false, "Bool should be okay");
		test.assertEqual(123, 123, "Number should be okay");
		test.assertEqual("hello", "hello", "String should be okay");
	});

	session.test("EQUAL should get failed if NOT equal", function(test){
		test.assertEqual(false, true, "Bool should not be okay");
		test.assertEqual(123, 321, "Number should not be okay");
		test.assertEqual("hello", "hello world", "String should not be okay");
		test.assertEqual("123", 123, "Type mismatch should not be okay");
	});

	session.test("TYPE STRUCT EQUAL should get ok if equal", function(test){
		test.assertTypeStructEqual([1,2,3], [1,2,3], "Array should be okay");
		test.assertTypeStructEqual(Uint8Array.from([2,3,4]), Uint8Array.from([2,3,4]), "Typed array should be okay");
		test.assertTypeStructEqual("hello", "hello", "value should be okay");
	});

	session.test("TYPE STRUCT EQUAL should get failed if NOT equal", function(test){
		test.assertTypeStructEqual([1,2,3], [1,2,4], "Not the same elements");
		test.assertTypeStructEqual([1,2,3], [1,2,3,4], "Expected is longer");
		test.assertTypeStructEqual([1,2,3,4], [1,2,3], "Value is longer");
		test.assertTypeStructEqual(Uint8Array.from([2,3,4]), [2,3,4], "Type mismatch should not be okay");
	});
});
