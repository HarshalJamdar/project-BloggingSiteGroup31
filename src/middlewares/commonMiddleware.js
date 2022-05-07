

const jwt = require("jsonwebtoken");
const blogModel = require("../models/blogModel");



const authentication=  async  function(req,res,next){

  let token = req.headers["x-Api-key"] || req.headers["x-api-key"];
  if (!token) {
    return res.status(400).send({ status: false, msg: "token must be present" });
  }
  let decodedToken = jwt.verify(token, "project1-uranium",
  async function(err, decoded) {
     if (!decoded){
         return res.status(400).send({ status: false, msg: "token is invalid" });
       }else if(err==null) {
                next()
             }
      });
  }
            


const authorisation = async function (req, res, next) {
  let token = req.headers["x-Api-key"] || req.headers["x-api-key"];

 let decodedtoken = jwt.verify(token, "project1-uranium");
 let authorLoggedIn = decodedtoken.authorId;

 let authorIdFound= await blogModel.findOne({authorId : authorLoggedIn}).select({_id : 0 , authorId:1})
  if (!authorIdFound) {
    return res.status(404).send({ status: false, data: "Author did not create blog" });
  } // author exist but not created blog. Here we are checking blog Id from author id.
  req["authorId"]= decodedtoken.authorId
  next();
}


module.exports.authentication = authentication;
module.exports.authorisation = authorisation;



