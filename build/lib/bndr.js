const Bndr = (function(){

	const modelRootAccessor = Symbol("model root accessor");
	const rootElement = Symbol("root element query accessor");
	const bindingTypes = {};
	const defaults = {
		template : null,
		bindings : null,
		model : null
	};

	function create(options){
		var bndr = {};
		bndr.options = Object.assign({}, defaults, options);
		bind(bndr);
		bndr.init();
		return bndr;
	}

	function bind(bndr){
		bndr.init = init.bind(bndr);
		bndr.bindApi = bindApi.bind(bndr);
		bndr.bindApiMethod = bindApiMethod.bind(bndr);
		bndr.attach = attach.bind(bndr);
		bndr.attachTo = attachTo.bind(bndr);
		bndr.remove = remove.bind(bndr);
		bndr.updateBinding = updateBinding.bind(bndr);
		bndr.setTemplate = setTemplate.bind(bndr);
		bndr.setModel = setModel.bind(bndr);
		bndr.onPropertySet = onPropertySet.bind(bndr);
		bndr.triggerUpdate = triggerUpdate.bind(bndr);
		bndr.getBoundModel = getBoundModel.bind(bndr);
		bndr.getBndrAndModel = getBndrAndModel.bind(bndr);
		bndr.query = query.bind(bndr);
		bndr.setListModel = setListModel.bind(bndr);
		bndr.setListTemplate = setListTemplate.bind(bndr);
		bndr.attachListTo = attachListTo.bind(bndr);
		bndr.onPush = onPush.bind(bndr);
		bndr.onPop = onPop.bind(bndr);
		bndr.pushArrayElement = pushArrayElement.bind(bndr);
		bndr.popArrayElement = popArrayElement.bind(bndr);
	}

	function init(){
		this.model = {
			bindings : this.options.bindings || [],
			extensions : new Map(),
			attachment : null,
			bndrs : []
		};

		this.bindApi();
		this.setTemplate(this.options.template);
		this.setModel(this.options.model || {});
	}

	function bindApi(){
		for(let key in bindingTypes){
			for(let methodName in bindingTypes[key].api){
				this.bindApiMethod(bindingTypes[key], methodName, bindingTypes[key].api[methodName])
			};
		}
	}

	function bindApiMethod(bindingType, methodName, method){
		this[methodName] = (...args) => {
			let bindingAttrs = method(...args);
			bindingAttrs.type = bindingType.type;
			this.model.bindings.push(bindingAttrs);
			this.model.bndrs.forEach(x => {
				x.model.bindings.push(bindingAttrs);
				x.updateBinding(x.model.bindings);
			});
			return this;
		};
	}

	function register(binding){
		bindingTypes[binding.type] = {
			api : binding.api,
			type : binding.type,
			implementation : binding.implementation
		};
	}

	function attachTo(element){
		this.model.attachment = element;
		if(Array.isArray(this.model.model)){
			this.attachListTo(element);
		}else{
			this.updateBinding(this.model.bindings, true);
			if(this.model.domRoot){
				element.appendChild(this.model.domRoot);
			}
		}
		return this;
	}

	function attach(){
		if(this.model.domRoot instanceof DocumentFragment){
			return console.error("Can only direct attach if template is a non-template node");
		}
		if(!Array.isArray(this.model.model)){
			this.updateBinding(this.model.bindings, true);
		}
		this.model.attachment = this.model.domRoot.parentNode;
		return this;
	}

	function attachListTo(element){
		this.model.bndrs.forEach(x => x.attachTo(element));
	}

	function remove(){
		this.model.elements.forEach(x => x.parentNode.removeChild(x));
	}

	function updateBinding(bindings, isInitial = false){
		if(!this.model.model || !this.model.template){
			return;
		}
		[].concat(bindings).forEach(binding => {
			let bindingType = bindingTypes[binding.type];
			if(!bindingType){
				throw `Could not find implementation for binding of type ${binding.type}`
			}
			if(!this.model.extensions[binding.type]){
				this.model.extensions[binding.type] = new Map();
			}
			bindingType.implementation({
				root : this.model.domRoot,
				elements : this.model.elements,
				model : this.model.model,
				binding : binding,
				storage : this.model.extensions[binding.type],
				isInitial : isInitial
			});
		});
	}

	function setTemplate(template){
		if(Array.isArray(this.model.model)){
			this.setListTemplate(template);
		}else{
			this.model.template = template;
			this.model.domRoot = getTemplate(template);
			this.model.elements = getDocfragChildList(this.model.domRoot);
			this.updateBinding(this.model.bindings);
		}

		if(this.model.attachment){
			this.attachTo(this.model.attachment);
		}

		return this;
	}

	function setListTemplate(template){
		this.model.bndrs.forEach(x => x.setTemplate(template));
	}

	function setModel(model){
		if(Array.isArray(model)){
			this.model.model = this.setListModel(model);
		}else if (model !== undefined && model !== null && typeof(model) == "object"){
			this.model.model = new Proxy(model, {
				set : this.onPropertySet
			});
		}else {
			throw "Cannot use value type, null or undefined as a model";
		}
		this.updateBinding(this.model.bindings);

		return this;
	}

	function setListModel(listModel){
		listModel.forEach(x => {
			this.model.bndrs.push(create({
				model : x,
				template : this.model.template,
				bindings : this.model.bindings.map(x => x)
			}));
		});
		listProxy = this.model.bndrs.map(x => x.getBoundModel());
		listProxy.push = new Proxy(listProxy.push, {
			apply : this.onPush
		});
		listProxy.pop = new Proxy(listProxy.pop, {
			apply : this.onPop
		});
		return listProxy;
		}

	function getBoundModel(){
		return this.model.model;
	}

	function getBndrAndModel(){
		return { bndr : this, model : this.getBoundModel() };
	}

	function query(selector){
		return queryElementsInList(this.elements, selector);
	}

	function onPropertySet(model, propertyName, newValue){
		if(model[propertyName] !== newValue){
			if(Array.isArray(model) && isNumber(propertyName) && propertyName < model.length){ //array element
				newValue = this.model.bndrs[propertyName].setModel(value).getBoundModel(); //possible bug value = newValue?
			}
			Reflect.set(model, propertyName, newValue);
			this.triggerUpdate(propertyName);
		}
		return true;
	}

	function onPush(target, thisArgument, argumentList){
		var model = this.pushArrayElement(argumentList[0]);
		Reflect.apply(target, thisArgument, [model]);
	}

	function onPop(target, thisArgument, argumentList){
		var model = this.popArrayElement(argumentList[0]);
		Reflect.apply(target, thisArgument, [model]);
	}

	function pushArrayElement(value){
		var bndr = create({
			model : value,
			template : this.model.template,
			bindings : this.model.bindings
		});
		this.model.bndrs.push(bndr);
		model = bndr.getBoundModel();
		if(this.model.attachment){
			bndr.attachTo(this.model.attachment);
		}
		return model;
	}

	function popArrayElement(){
		var model = this.model.bndrs.pop();
		model.remove();
	}

	function triggerUpdate(propertyName){
		var bindings = this.model.bindings.filter(x => propertyMatch(x.accessor, propertyName));
		this.updateBinding(bindings);
	}

	function propertyMatch(accessor, propertyName){
		if(!accessor){
			return false;
		}
		if(Array.isArray(accessor)){
			var propNames = accessor.map(getTopLevelProperty);
			return propNames.includes(propertyName);
		}
		return propertyName === getTopLevelProperty(accessor);
	}

	//Static Methods
	function getTemplate(templateElement){
		if(!templateElement){
			return null;
		}
		if(templateElement.tagName == "TEMPLATE"){
			return document.importNode(templateElement.content, true);
		}
		return templateElement;
	}

	function getDocfragChildList(docfrag){
		if(!docfrag){
			return [];
		}
		var list = [];
		for(var i = 0; i < docfrag.children.length; i++){
			list.push(docfrag.children[i]);
		}
		return list;
	}

	function isNumber(value) {
		return !isNaN(value-0) && value !== null && value !== "" && value !== false;
	}

	function getTopLevelProperty(accessor){
		if(accessor.includes(".")){
			return accessor.split(".")[0];
		}
		return accessor;
	}

	function access(obj, accessor){
		if(!obj || !accessor){
			return null;
		}

		if(accessor === modelRootAccessor){ //asymmetric with set but useful for some read ops
			return obj;
		}

		let keys = accessor.split(".");
		let prop = obj;
		for(let i = 0; i < keys.length; i++){
			if(keys[i] !== undefined && keys[i] !== ""){
				if(prop !== null && prop[keys[i]] !== undefined){
					prop = prop[keys[i]];
				}else{
					return null;
				}
			}
		}
		return prop;
	}

	function setObjectProp(obj, accessor, value){
		let keys = accessor.split(".");
		let prop = obj;
		for(let i = 0; i < keys.length-1; i++){
			if(keys[i] !== undefined){
				if(prop[keys[i]] !== undefined){
					prop = prop[keys[i]];
				}else{
					console.error("Could not find property:", obj, accessor);
				}
			}
		}
		if(prop.hasOwnProperty(keys[keys.length-1]) !== undefined){
			prop[keys[keys.length-1]] = value;
		}else{
			console.error("Could not find property:", obj, accessor);
		}
	}

	function getFromMapTree(map, ...accessors){
		let value = map;
		for(var i = 0; i < accessors.length; i++){
			if(value.has(accessors[i])){
				value = value.get(accessors[i]);
			}else{
				return null;
			}
		}
		return value;
	}

	function setToMapTree(map, ...accessors){
    	for(var i = 0; i < accessors.length - 1; i++){
    		if(i === accessors.length - 2){
    			map.set(accessors[i], accessors[i + 1]);
			}
			if(map.has(accessors[i])){
				map = map.get(accessors[i]);
	    	}else{
	    		let newMap = new Map();
	    		map.set(accessors[i], newMap);
	    		map = newMap;
	    	}
		}
	}

	function queryElementsInList(elements, selector){
		var matchingElements = [];

		if(!elements){
			return [];
		}

		for(var i = 0; i < elements.length; i++){
			var foundElements = elements[i].parentNode.querySelectorAll(selector); //need parent because this can include self
			if(foundElements.length > 0){
				for(var j = 0; j < foundElements.length; j++){
					if(isAncestorOrSelf(elements[i], foundElements[j])){ //check that we didn't find on some unrelated branch off parent
						matchingElements.push(foundElements[j]);
					}
				}
			}
		}
		return matchingElements;
	}

	function isAncestorOrSelf(thisNode, nodeToTest){
		while(thisNode != nodeToTest){
			if(nodeToTest.parentNode){
				nodeToTest = nodeToTest.parentNode;
			}else{
				return false;
			}
		}
		return true;
	}

	function getSelectedElements(root, activeElements, selector){
		if(selector === rootElement){
			return root;
		}
		return queryElementsInList(activeElements, selector);
	}

	return {
		create: create,
		register : register,
		access : access,
		setObjectProp : setObjectProp,
		getFromMapTree : getFromMapTree,
		setToMapTree : setToMapTree,
		queryElementsInList : queryElementsInList,
		getSelectedElements : getSelectedElements,
		modelRootAccessor : modelRootAccessor,
		rootElement : rootElement
	};

})();
(function(){

	const inputEventMap = {
		"TEXT" : "input",
		"CHECKBOX" : "change",
		"RADIO" : "change",
		"TEXTAREA" : "input",
		"SELECT" : "change",
		"PASSWORD" : "input",
		"URL" : "input",
		"EMAIL" : "input",
		"TEL" : "input",
		"DATE" : "input"
	};

	const inputValueMap = {
		"TEXT" : "value",
		"CHECKBOX" : "checked",
		"TEXTAREA" : "value",
		"SELECT" : "value",
		"PASSWORD" : "value",
		"URL" : "value",
		"EMAIL" : "value",
		"TEL" : "value",
		"DATE" : "value",
		"*" : "textContent"
	};

	function setElement(element, value){
		let inputType = getInputType(element);
		if(inputType === "RADIO"){
			element.checked = element.value === value;
		}else{
			element[getInputElementMappedValue(element, inputValueMap)] = value;
		}
	}

	function attachUpdateEvent(element, model, accessor, storage){
		let eventName = getInputElementMappedValue(element, inputEventMap);
		let handler = setModel.bind(this, element, model, accessor);
		handler.boundFrom = setModel; //gives us a handle to the original for equality testing
		attachEvent(element, eventName, handler, storage);
	}

	function setModel(element, model, accessor){
		let inputType = getInputType(element);
		let value;
		if(inputType === "RADIO"){
			if(element.checked){
				value = element.value;
			}else{
				return;
			}
		}else{
			value = element[getInputElementMappedValue(element, inputValueMap)];
		}
		Bndr.setObjectProp(model, accessor, value);
	}

	function getInputType(element){
		let elementType = element.tagName.toUpperCase();
		if(elementType === "INPUT"){
			return element.type.toUpperCase();
		}
		return elementType;
	}

	function getInputElementMappedValue(element, map){
		let inputType = getInputType(element);
		let result = map[inputType];
		if(!result){
			result = map["*"];
		}
		return result;
	}

	function attachEvent(element, eventName, handler, storage){
		let storedHandler = Bndr.getFromMapTree(storage, "events", element, eventName);
		if(handler === storedHandler || handler.boundFrom === storedHandler){
			return;
		}
		element.addEventListener(eventName, handler);
		Bndr.setToMapTree(storage, "events", element, eventName, handler.boundFrom ? handler.boundFrom : handler);
	}

	Bndr.register({
		api : {
			bindElement : function(selector, accessor){
				return {
					accessor : accessor,
					selector : selector,
					updatesView : true,
					updatesModel : false
				}
			},
			bindElementReverse : function(selector, accessor, initialBind = true){
				return {
					accessor : accessor,
					selector : selector,
					updatesView : false,
					updatesModel : true,
					initialBind : initialBind
				}
			},
			bindElementTwoWay : function(selector, accessor, initialBind = true){
				return {
					accessor : accessor,
					selector : selector,
					updatesView : true,
					updatesModel : true,
					initialBind : initialBind
				}
			}
		},
		implementation : function({ elements, model, binding, storage } = {}){
			let selectedElements = Bndr.queryElementsInList(elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				if(binding.updatesModel){
					attachUpdateEvent(x, model, binding.accessor, storage);
					if(!value && binding.initialBind){
						setModel(x, model, binding.accessor)
					}
				}
				if(binding.updatesView){
					setElement(x, value);
				}
			});
		},
		type : "element"
	});

})(Bndr);
(function(){

	function setClass(element, klass, value, reversed){
	  if(!reversed && !!value || (reversed && !value)){
		  element.classList.add(klass);
	  }else{
		element.classList.remove(klass);
	  }
	}

	Bndr.register({
		api : {
			bindClass : function(selector, accessor, klass){
				return {
					accessor : accessor,
					selector : selector,
					klass : klass,
					type : "class",
					reversed : false
				};
			},
			bindClassReversed : function(selector, accessor, klass){
				return {
					accessor : accessor,
					selector : selector,
					klass : klass,
					type : "class",
					reversed : true
				};
			}
		},
		implementation : function({ root, elements, model, binding, storage } = {}){
			let selectedElements = Bndr.getSelectedElements(root, elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				setClass(x, binding.klass, value, binding.reversed);
			});
		},
		type : "class"
	});

})(Bndr);
(function(){

	function setAttribute(element, attribute, value){
		element.setAttribute(attribute, value);
	}

	function setAttributeExistence(element, attribute, value, reversed){
		if((!reversed && !!value) || (reversed && !value)){
    		element.setAttribute(attribute, "");
    	}else{
    		element.removeAttribute(attribute);
    	}
	}

	Bndr.register({
		api : {
			bindAttribute : function(selector, accessor, attribute){
				return {
					accessor : accessor,
					selector : selector,
					attribute : attribute,
					type : "attribute"
				}
			}
		},
		implementation : function({ elements, model, binding, storage } = {}){
			let selectedElements = Bndr.queryElementsInList(elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				setAttribute(x, binding.attribute, value);
			});
		},
		type : "attribute"
	});

	Bndr.register({
		api : {
			bindAttributeExistence : function(selector, accessor, attribute){
				return {
					accessor : accessor,
					selector : selector,
					attribute : attribute,
					type : "attribute-existence",
					reversed : false
				}
			},
			bindAttributeExistenceReversed : function(selector, accessor, attribute){
				return {
					accessor : accessor,
					selector : selector,
					attribute : attribute,
					type : "attribute-existence",
					reversed : true
				}
			}
		},
		implementation : function({ elements, model, binding, storage } = {}){
			let selectedElements = Bndr.queryElementsInList(elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				setAttributeExistence(x, binding.attribute, value, binding.reversed);
			});
		},
		type : "attribute-existence"
	});

})(Bndr);
(function(){

	function setStyle(element, style, value){
		element.style[style] = value;
	}

	Bndr.register({
		api : {
			bindStyle : function(selector, accessor, style){
				return {
					accessor : accessor,
					selector : selector,
					style : style,
					type : "style"
				}
			}
		},
		implementation : function({ elements, model, binding, storage } = {}){
			let selectedElements = Bndr.queryElementsInList(elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				setStyle(x, binding.style, value);
			});
		},
		type : "style"
	});

})(Bndr);
(function(){

	function attachEvent(obj, eventName, handler, value, storage){
		let storedHandler = Bndr.getFromMapTree(storage, "events", obj, eventName);
		if(handler === storedHandler || handler.boundFrom === storedHandler){
			return;
		}
		obj.addEventListener(eventName, e => handler(e, value));
		Bndr.setToMapTree(storage, "events", obj, eventName, handler.boundFrom ? handler.boundFrom : handler);
	}

	Bndr.register({
		api : {
			bindEvent : function(selector, eventName, handler, accessor){
				if(typeof(handler) !== "function"){
					return console.warn(`Could not bind ${eventName} ${selector}, handler is not a function`);
				}
				return {
					eventName : eventName,
					selector : selector,
					handler : handler,
					accessor : accessor,
					type : "event"
				};
			}
		},
		implementation : function({ root, elements, model, binding, storage } = {}){
			let value = Bndr.access(model, binding.accessor);

			if(typeof(binding.selector) === "string"){
				let selectedElements = Bndr.getSelectedElements(root, elements, binding.selector);
				selectedElements.forEach(x => {
					attachEvent(x, binding.eventName, binding.handler, value, storage);
				});
			} else {
				if(!binding.selector.addEventListener){
					return console.error("Objects with bind event must support addEventListener.");
				}
				attachEvent(binding.selector, binding.eventName, binding.handler, value, storage);
			}
		},
		type : "event"
	});

})(Bndr);
(function(){
	Bndr.register({
		api : {
			bindChange : function(accessor, handler){
				return {
					accessor : accessor,
					handler : handler,
					type : "change"
				}
			}
		},
		implementation : function({ model, binding, isInitial } = {}){
			if(isInitial){
				return;
			}
			let value = Bndr.access(model, binding.accessor);
			binding.handler(value, model);
		},
		type : "change"
	});

})(Bndr);
(function(){

	Bndr.register({
		api : {
			computeValue : function(accessor, handler, resultName){
				if(typeof(handler) !== "function"){
					return console.warn(`Could not bind compute ${JSON.stringify(accessor)}. Handler is not a function`);
				}
				return {
					accessor : accessor,
					handler : handler,
					resultName : resultName,
					type : "compute-value"
				};
			}
		},
		implementation : function({ model, binding } = {}){
			let values = [].concat(binding.accessor).map(x => Bndr.access(model, x));
			Bndr.setObjectProp(model, binding.resultName, binding.handler(...values));
		},
		type : "compute-value"
	});

})(Bndr);
(function(){

	function attachToggleEvent(element, model, binding, storage){
		let bindingKey = getBindingKey(binding);
		let storedBinding = Bndr.getFromMapTree(storage, bindingKey);
		if(storedBinding === binding){
			return;
		}
		let handler = toggle.bind(null, model, binding);
		handler.boundFrom = toggle;
		element.addEventListener(binding.eventName, handler);
		Bndr.setToMapTree(storage, bindingKey, binding);
	}

	function getBindingKey(binding){
		return [binding.selector, binding.accessor, binding.eventName, `(${binding.values.join("-")})`].join("-");
	}

	function toggle(model, binding){
		let value = Bndr.access(model, binding.accessor);
		let valueIndex = binding.values.indexOf(value);
		valueIndex++;
		if(valueIndex >= binding.values.length){
			valueIndex = 0;
		}
		let newValue = binding.values[valueIndex];
		Bndr.setObjectProp(model, binding.accessor, newValue);
	}

	Bndr.register({
		api : {
			bindToggle : function(selector, eventName, accessor, values = [true, false]){
				return {
					selector : selector,
					accessor : accessor,
					eventName : eventName,
					values : values,
					type : "toggle"
				};
			}
		},
		implementation : function({ elements, model, binding, storage, isInitial } = {}){
			let selectedElements = Bndr.queryElementsInList(elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				attachToggleEvent(x, model, binding, storage);
			});
		},
		type : "toggle"
	});

})(Bndr);
(function(){

	function attachDragEvent(element, model, binding, storage){
		attachNoDupe(element, model, binding, storage, "dragover", dragOver);
		attachNoDupe(element, model, binding, storage, "dragleave", dragLeave);
	}

	function attachNoDupe(element, model, binding, storage, eventName, handler){
		let bindingKey = getBindingKey(binding, eventName);
		let storedBinding = Bndr.getFromMapTree(storage, bindingKey);
		if(storedBinding === binding){
			return;
		}
		let boundHandler = handler.bind(null, model, binding);
		boundHandler.boundFrom = handler;
		element.addEventListener(eventName, boundHandler);
		Bndr.setToMapTree(storage, bindingKey, binding);
	}

	function getBindingKey(binding, eventName){
		return [binding.selector, binding.accessor, eventName].join("-");
	}

	function dragOver(model, binding, e){
		e.preventDefault();
		Bndr.setObjectProp(model, binding.accessor, true);
	}

	function dragLeave(model, binding, e){
		e.preventDefault();
		Bndr.setObjectProp(model, binding.accessor, false);
	}

	Bndr.register({
		api : {
			bindDrag : function(selector, accessor){
				return {
					selector : selector,
					accessor : accessor,
					type: "drag"
				}
			}
		},
		implementation : function({ elements, model, binding, storage } = {}){
			let selectedElements = Bndr.queryElementsInList(elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				attachDragEvent(x, model, binding, storage);
			});
		},
		type : "drag"
	});

})(Bndr);
(function(){
	let db;

	function get(namespace, accessor){
		return new Promise((resolve, reject) => {
			db.then(database => {
				let transaction = database.transaction("storage", "readonly");
				let store = transaction.objectStore("storage");
				let request = store.get(`${namespace}-${accessor}`);
				request.onerror = () => reject(request.error);
				request.onsuccess = (e) => {
					resolve(e.target.result);
				};
			});
		});
	}

	function save(namespace, accessor, value){
		return new Promise((resolve, reject) => {
			db.then(database => {
				let transaction = database.transaction("storage", "readwrite");
				let store = transaction.objectStore("storage");
				let request = store.put(value, `${namespace}-${accessor}`);
				request.onerror = () => reject(request.error);
				request.onsuccess = (e) => {
					resolve(e.target.result);
				}
			});
		});
	}

	Bndr.clearStorage = function(){
		return new Promise((resolve, reject) => {
			db.then(database => {
				let transaction = database.transaction("storage", "readwrite");
				let store = transaction.objectStore("storage");
				let request = store.clear();
				request.onerror = () => reject(request.error);
				request.onsuccess = (e) => resolve(e.target.result);
			});
		});
	}

	function setupStorage(){
		if(db){
			return;
		}
		db = new Promise((resolve, reject) => {
			let openRequest = indexedDB.open("bndr-storage", 1);
			openRequest.onerror = () => reject(openRequest.error);
			openRequest.onupgradeneeded = (e) => {
				if(!e.target.objectStoreNames.contains("storage")){
					e.target.result.createObjectStore("storage");
				}
			};
			openRequest.onsuccess = () => resolve(openRequest.result);
		});
	}

	Bndr.register({
		api : {
			bindStorage : function(accessor, namespace){
				setupStorage();
				return {
					accessor : accessor,
					namespace : namespace,
					type : "storage"
				}
			}
		},
		implementation : function({ model, binding, isInitial } = {}){
			if(isInitial){
				get(binding.namespace, binding.accessor).then(value => {
					if(value !== undefined){
						Bndr.setObjectProp(model, binding.accessor, value);
					}
				});
			}else{
				let value = Bndr.access(model, binding.accessor);
				save(binding.namespace, binding.accessor, value)
					.catch(error => console.error(error));
			}
		},
		type : "storage"
	});

})(Bndr);
(function(){

	function setView(element, model, view, options){
		view.create(Object.assign({}, {
			root : element,
			model : model,
		}, options));
	}

	Bndr.register({
		api : {
			bindView : function(selector, accessor, view, options){
				return {
					accessor,
					selector,
					view,
					options
				}
			}
		},
		implementation : function({ elements, model, binding, isInitial } = {}){
			if(!isInitial){
				return;
			}
			let selectedElements = Bndr.queryElementsInList(elements, binding.selector);
			let value = Bndr.access(model, binding.accessor);
			[].concat(selectedElements).forEach(x => {
				setView(x, value, binding.view, binding.options);
			});
		},
		type : "view"
	});

})(Bndr);
