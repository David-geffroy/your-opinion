/*	
 *	ROUTE USED TO TEST THE CIID FRAME
 *	
**/

var express = require('express');
var util = require('../util/utils')
var router = express.Router();

router.get('/', function(req, res) {
	res.render('test_ciid',{scripts:[]});
});

module.exports = router;
