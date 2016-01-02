<?php

echo "<div id=\"ciid-div\"></div>
<script type=\"text/javascript\">
	var ciid_token = '". get_option('token') . "';
	var ciid_mode = 'admin';
	(function() {
		var dsl = document.createElement('script');
		dsl.type = 'text/javascript';
		dsl.async = true;
		dsl.src = '//what-is-your-opinion.com/api/javascripts/apiLoader.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsl);
	})();
</script>";
