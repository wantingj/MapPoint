Parse.Cloud.define("initPage", function(request, response) {
  var mapId = request.params.mapId || "xjPDDwHsvK";
  //console.log("mapid: "+mapId);
  
  var MyMap = Parse.Object.extend("MyMap");
  var query = new Parse.Query(MyMap);
  
  query.get(mapId, {
    success: function(queryMyMap) {
      // 查詢 目標地圖 成功
      
      queryMyMap.get("author").fetch({
        success: function(user) {
          //撈作者成功
          var targetMapAuthorName = "";
          if(user){
            targetMapAuthorName = user.get("username");
          }
          
          // 準備撈目標地圖點集合
          var MapPoint = Parse.Object.extend("MapPoint");
          var query = new Parse.Query(MapPoint);
          query.equalTo("map", mapId);
          query.find({
            success: function(mapPoints) {
              // 查 map point 成功              
              var currentUser = Parse.User.current();
              if(!currentUser){
                //未登入
                response.success({
                  targetMapId: mapId,
                  targetMapName: queryMyMap.get("name"),
                  points: mapPoints,                  
                  targetMapAuthorName: targetMapAuthorName,
                  userMapInfoList: [],
                  editable: false
                });      
              } else {
                // 已登入 查由該用戶建立的地圖
                var query = new Parse.Query(MyMap);
                query.equalTo("author", currentUser);
                query.find({
                  success: function(userMapList) {
                    var userMapInfoList = [];
                    for (var i=0; i<userMapList.length; i++){
                      userMapInfoList.push({
                        name: userMapList[i].get("name"),
                        mapId: userMapList[i].id
                      });
                    }
                    
                    // 查屬於用戶的地圖 成功
                    response.success({
                      targetMapId: mapId,
                      targetMapName: queryMyMap.get("name"),
                      points: mapPoints,             
                      targetMapAuthorName: targetMapAuthorName,                      
                      userMapInfoList: userMapInfoList,
                      editable: queryMyMap.getACL().getWriteAccess(currentUser.id)
                    });
                    
                  },
                  error: function(error) {
                    // 查屬於用戶的地圖 失敗
                    response.error(setOutputError(error, "查詢 屬於用戶的地圖 失敗"));
                  }
                });
                
              }
            },
            error: function(error){
              //查 map point 失敗
              response.error(setOutputError(error, "查詢 map point 失敗"));
            }
          });
          
        },
        error: function(error) {
          //撈作者失敗
          response.error(setOutputError(error, "撈作者 失敗"));
        }
      });
      
    },
    error: function(error) {
      // 查詢 目標地圖 失敗
      response.error(setOutputError(error, "查詢 目標地圖 失敗"));
    }
  });
  
});

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  console.log("使用者修改");
  console.log(request.object.get("username").length);
  if (request.object.get("username").length < 4) {
    response.error("帳號太短，至少四個字元");
  } else {
    response.success();
  }
});

Parse.Cloud.beforeSave("MapPoint", function(request, response) {
  if (!request.object.get("map")) {
    response.error("需指定關聯地圖");
  } else if(request.object.get("addr").length < 5){
    response.error("地址太短，請輸入6~20字");
  } else if(request.object.get("addr").length > 21){
    response.error("地址太長，請輸入6~20字");
  } else {
    response.success();
  }
});

function setOutputError(error, customErrMsg) {
  var output = customErrMsg;
  if(error) {
    output = "; "+"Error " + error.code + " : " + error.message;
  }
  return output;
}