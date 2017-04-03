const Util = (function(){
	function copy(element){
		var hasSelection = document.queryCommandEnabled('copy');
		if(!hasSelection){
			console.log('copy not enabled');
		}

		if(element.tagName.toUpperCase === "TEXTAREA" || element.type === "text"){
			element.select();
		}else{
			let range = document.createRange();
			range.selectNode(element);
			window.getSelection().addRange(range);
		}

		try {
			var successful = document.execCommand('copy');
		} catch(err) {
			console.log('execCommand Error', err);
		}
	}
	function download(url, fileName){
		let link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		link.click();
	}

	function stringToDataUri(newString, options){
		options = options || {};
		var mimeType = options.mimeType || "text/plain";
		var base64 = options.base64 || false;
		var charEncoding = options.charEncoding || "utf8";
		var uri = "data:" + mimeType + ";utf8";
		if(base64){
			uri += ";Base64," + atob(newString);
		}else{
			uri += "," + encodeURIComponent(newString);
		}
		return uri;
	}

	return {
		copy,
		download,
		stringToDataUri
	};
})();
