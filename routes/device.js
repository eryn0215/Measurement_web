var express = require('express');
var router = express.Router();
var path = require("path");


//var url = "mongodb://localhost:27017/test";
/* GET users listing. */

router.get('/patch', function(req, res, next) {

  res.sendFile(path.join(__dirname,"../views","patch_BS.html"));
});
router.get('/knee', function(req, res, next) {
  console.log(req.query['deviceid']);
  res.render('knee',{hello:'world'});
});
module.exports = router;
