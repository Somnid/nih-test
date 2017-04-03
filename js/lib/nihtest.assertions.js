const NihTestAssertions = (function(){

	function assertionPassed(assertion){
		switch(assertion.type){
			case "typeStructEqual":
				return typeStructEqual(assertion.value, assertion.expected);
			default:
				return assertion.expected === assertion.value;
		}
	}

	function typeStructEqual(value, expected){
		if(isArray(value)){
			return getFunctionName(value.constructor) === getFunctionName(expected.constructor)
				&& value.length === expected.length
				&& value.reduce((e,x,i) => e && typeStructEqual(x, expected[i]), true);
		}
		else if (value instanceof Object){
			console.error("Can't to object compare yet")
			return false;
		}
		return value === expected;
	}

	function getFunctionName(func) {
		return func.toString().match(/function ([^\(]+)/)[1];
	}

	function isArray(value){
		return Array.isArray(value)
			|| value instanceof Int8Array
			|| value instanceof Uint8Array
			|| value instanceof Uint8ClampedArray
			|| value instanceof Int16Array
			|| value instanceof Uint16Array
			|| value instanceof Int32Array
			|| value instanceof Uint32Array
			|| value instanceof Float32Array
			|| value instanceof Float64Array;
	}

	return {
		assertionPassed
	};

})();
