NIH Test
========

Not Invented Here Test.  A personal testing framework because, why not?  Designed to be web-first.  Highly unstable and experimental.

https://ndesmic.github.com/nih-test


NihTest
=======

NihTest.testSession(name: String, session: TestSession => void)
---------------------------

Starts a new named session


NihTestSession
===========

test(name: String, test: Test => void)
---------------------------

Starts a new named test

NihTest
===========

assertOk(value: Boolean, description: String)
---------------------------

Add an assertion that the value is true with description.

assertNotOk(value: Boolean, description: String)
---------------------------

Add an assertion that the value is false with description.

assertEqual(value: any, expected: any, description: String)
---------------------------

Add an assertion that the value is strictly equal to the expectation with description.

assertTypeStructEqual(value: any, expected: any, description: String)
---------------------------

Add an assertion that the value is structurally equal and of the same time as the expectation with description.