var mysql = require('mysql');
var dbConfig = require('./dbConfig').dbConfig;
let tableName = dbConfig.tableName;
var pool  = mysql.createPool({
  host     : dbConfig.host,
  user     : dbConfig.user,
  password : dbConfig.password,
  database : dbConfig.database
}); 
console.log("Connected to SQL");

async function commonQuery(query, paramArray){
  return await new Promise(function(resolve, reject) {
    pool.getConnection(function(err, connection) {
    if(!err){
      connection.query(query,paramArray, function (err, results) { 
        connection.release();
        if(!err){
            resolve(results); 
        }
        else {
            reject(err);
        }
      });
    }
    else {
      reject(err);
    }
  });
})}

module.exports.setHandle = async(userId,value)=>{
  let query = "UPDATE "+tableName+" SET handle = ?, code_verifier = ? WHERE userId = ?";
  let params = [value.handle, value.code_verifier, userId];
  let result = await commonQuery(query, params);
  if(result.affectedRows==0){
    query = "INSERT INTO "+tableName+" (userId,handle,code_verifier) VALUES (?,?,?)";
    params = [userId,value.handle,value.code_verifier];
  }
  await commonQuery(query,params);
}

module.exports.getHandle=async(userId)=>{
  let query = "SELECT handle,code_verifier FROM "+tableName+" WHERE userId = ?";
  let params = [userId];
  let result = await commonQuery(query,params);
  result = result[0];
  let obj = {handle:result.handle,code_verifier:result.code_verifier};
  return obj;
}

