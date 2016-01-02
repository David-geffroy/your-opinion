var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;						// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = typeof InstallTrigger !== 'undefined';											// Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;	// At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome && !isOpera;														// Chrome 1+
var isIE = /*@cc_on!@*/false || !!document.documentMode;										// At least IE6

var ciid_comments_frame = document.createElement("iframe");

ciid_comments_frame.title ="What is your opinion ?";
ciid_comments_frame.src = "//what-is-your-opinion.com/api/#/" + ciid_mode + "?token=" + ciid_token + "&loc=" + encodeURIComponent(window.location);

ciid_comments_frame.allowTransparency = "true";
ciid_comments_frame.frameBorder = 0;
ciid_comments_frame.scrolling = "no";
if (isIE) {
	ciid_comments_frame.frameBorder = "0";
} else {
	ciid_comments_frame.border = "none";
}

ciid_comments_frame.width = "100%";

ciid_comments_frame.onerror = function() {
	console.log("Error during loading the frame");
};

var ciid_div = document.getElementById("ciid-div");
ciid_div.appendChild(ciid_comments_frame);

var script = document.createElement("script");
script.type = "text/javascript";
script.src = "//what-is-your-opinion.com/javascripts/iframeResizer.js";
document.body.appendChild(script);

var callback = function() {
	iFrameResize({
		log: false,
		heightCalculationMethod: 'lowestElement'
	}, ciid_comments_frame);
};

script.onreadystatechange = callback;
script.onload = callback;