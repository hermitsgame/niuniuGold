require('pomelo-cocos2d-js');

var confige = require("confige");
var tipsConf = require("tips").tipsConf;

cc.Class({
    extends: cc.Component,
    properties: {
    },
    onLoad: function () {
    },
});

var pomelo = window.pomelo;

var clientData = {
    diamond : 0,
    head : 0,
    nickName : "nick",
    uid : 1003
}
pomelo.clientScene = {};
pomelo.clientScene.connectCallBack = function(){};

pomelo.on("onMessage",function(data) {
    console.log("onMessage");
    console.log(data);
    pomelo.dealWithOnMessage(data);
}); 

pomelo.dealWithOnMessage = function(data){
    switch(data.cmd)
    {
        case "roomPlayer" :     //需要转换          OK
            confige.roomData = data;
            confige.roomPlayer = data.player;
            confige.roomId = data.roomId;
            confige.gameSceneLoadOver = false;
            confige.gameSceneLoadData = [];
            cc.loader.onProgress = function(completedCount, totalCount, item) {};

            if(confige.roomData.roomType == "mingpaiqz" || confige.roomData.roomType == "niuniu")
                confige.isGoldMode = false;
            else 
                confige.isGoldMode = true;
            
            cc.director.loadScene('GoldScene');
            confige.curReconnectType = confige.ON_GAME;
            break;
        case "userInfo" :
            cc.loader.onProgress = function(completedCount, totalCount, item) {
                var progress = (completedCount / totalCount).toFixed(2);
                var numString = "" + completedCount + "/" + totalCount;
                if(totalCount > 10){
                    confige.loadNode.showNode();
                    confige.loadNode.setProgress(progress,numString);
                }
            };
            console.log(data);
            confige.userInfo = data.data;
            confige.playerLimits = confige.userInfo.limits;
            confige.curDiamond = confige.userInfo.diamond;
            confige.curHistory = confige.userInfo.history;
            confige.curGold = confige.userInfo.gold;
            confige.curSignature = confige.userInfo.signature;
            confige.curCharmNum = confige.userInfo.charm;
            confige.curCharmAdd = confige.userInfo.refreshList.charmValue
            confige.curSex = parseInt(confige.userInfo.sex);
            console.log("confige.curSex==="+ confige.curSex);
            if(confige.loginType == 0)
            {
                confige.curUseId = data.data.uid;
                cc.sys.localStorage.setItem('lastLoginUid', confige.curUseId);
            }

            var newCallBack = function(){
                if(confige.curReconnectType == confige.ON_LOGIN)
                {
                    confige.curReconnectType = confige.ON_HALL;
                }
                if(data.reconnection)       //是否有重连数据
                {
                    confige.curReconnectData = data.reconnection;
                    confige.roomData = data.reconnection.roomInfo;
                    confige.roomPlayer = data.reconnection.roomInfo.player;
                    confige.roomId = data.reconnection.roomInfo.roomId;
                    if(confige.curReconnectType == confige.ON_HALL)
                    {
                        //自动跳转游戏场景并恢复数据
                        console.log("自动跳转游戏场景并恢复数据");
                        confige.gameSceneLoadOver = false;
                        confige.gameSceneLoadData = [];

                        if(confige.roomData.roomType == "mingpaiqz" || confige.roomData.roomType == "niuniu")
                            confige.isGoldMode = false;
                        else 
                            confige.isGoldMode = true;

                        cc.director.loadScene('GoldScene');
                        confige.curReconnectType = confige.ON_GAME;
                    }else if(confige.curReconnectType == confige.ON_GAME){
                        //已经在游戏场景内,直接恢复数据
                        console.log("已经在游戏场景内,直接恢复数据");
                        pomelo.clientScene.gameInfoNode.btnClickRefresh();
                    }
                }else{                      //没有则直接进入大厅界面
                    if(confige.curReconnectType != confige.ON_OVER)     //当处于结算界面时,不自动跳回大厅界面;
                    {
                        cc.director.loadScene('HallScenePlus');
                        confige.resetGameData();
                    }
                }
            };

            if(confige.loginType == 1 || confige.loginType == 2)
            {
                confige.getWXHearFrame(confige.userInfo.head, 0, newCallBack);
            }else{
                newCallBack();
            }
            
            break;
        case "userJoin":        //需要转换          OK
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex == 2)
                {
                    if(confige.settleWait == false)
                        pomelo.clientScene.gamePlayerNode.addOnePlayer(data.player);
                    else
                        confige.settleWaitData.push(data);
                }
            }
            break;
        case "userQuit":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex == 2)
                {
                    if(confige.settleWait == false)
                        pomelo.clientScene.gamePlayerNode.playerQuit(data.chair);
                    else
                        confige.settleWaitData.push(data);
                }
            }
           
            //data.uid  data.chair
            break;
        case "userReady" :      //需要转换          OK
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                pomelo.clientScene.onServerReady(confige.getCurChair(data.chair));      
            }
            break;
        case "deal" :           //需要转换          OK
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.onServerDealCard(data.handCards);
            }
            
            break; 
        case "settlement" :
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                console.log(pomelo.clientScene);
                if(pomelo.clientScene.gameBegin == true)
                    pomelo.clientScene.onServerSettlement(data);
                else
                    console.log("pomelo.clientScene.gameBegin == false");
            }
            break;
        case "beginBetting":    //需要转换          OK
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                if(confige.gameBeginWait == true){
                    console.log("confige.gameBeginWaitData.push(data);");
                    confige.gameBeginWaitData.push(data);
                }
                else{
                    console.log("pomelo.clientScene.onServerBeginBetting(data);");
                    pomelo.clientScene.onServerBeginBetting(data);
                }
            }
            break;
        case "gameOver":
            confige.curReconnectType = confige.ON_OVER;
            if(pomelo.clientScene.gameBegin == true)
            {
                pomelo.clientScene.gameInfoNode.showOverLayer(data);
            }else{
                confige.quitToHallScene(true);
            }
            break;
        case "beginRob":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                if(confige.gameBeginWait == true)
                    confige.gameBeginWaitData.push(data);
                else
                    pomelo.clientScene.onServerRobBanker();
            }   
            break;
        case "robBanker":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                pomelo.clientScene.onServerRobBankerReturn(data);
            }
            break;
        case "banker":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                pomelo.clientScene.setBanker(data.chair);
            }   
            break;
        case "MingCard":        //需要转换
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                if(confige.gameBeginWait == true)
                    confige.gameBeginWaitData.push(data);
                else
                    pomelo.clientScene.showMingCard(data.Cards);
            }
            break;
        case "showCard":        //需要转换          OK
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                pomelo.clientScene.gamePlayerNode.showOneCard(data.chair,0,data.result.Comb);
                pomelo.clientScene.gamePlayerNode.noShowCardCount --;
                console.log("pomelo.clientScene.noShowCardCount === " + pomelo.clientScene.gamePlayerNode.noShowCardCount);
                if(pomelo.clientScene.gamePlayerNode.noShowCardCount <= 0)
                {
                    pomelo.clientScene.timerItem.hideTimer();
                    console.log("hideTimer!!!!!");
                }
            }
            break;
        case "bet":             //需要转换          OK
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                pomelo.clientScene.addBet(data.bet,confige.getCurChair(data.chair));
            }
            break;
        case "bonusPool":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.curSceneIndex != 2)
                    break;
                pomelo.clientScene.showScorePool(data.bonusPool,0,data.bankerScore,data.change);
            }
            break; 
        case "sayMsg":
            if(confige.curSceneIndex != 2)
                break;
            pomelo.clientScene.gameInfoNode.showSayWithMsg(data.chair,data.msg);
            break;
        //以下为炸金牛模式新增的协议
        case "curRound":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.onServerZhaCall(data);
            }
            break;
        case "nextPlayer":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.onServerZhaCall(data);
            }
            break;
        case "gameStart":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.onNewGameStart();
            }
            break;
        case "gameBegin":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(confige.gameBeginWait == true)
                    confige.gameBeginWaitData.push(data);
                else
                    pomelo.clientScene.onNewGameBegin(data);
            }        
            break;
        case "lookCard":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.onServerZhaCall(data);
            }
            break;
        case "compare":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.onServerZhaCall(data);
            }
            break;
        case "giveUp":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.onServerZhaCall(data);
            }
            break;
        case "finishGame":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else
                pomelo.clientScene.gameInfoNode.onServerShowFinish(data);
            break;
        case "responseFinish":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else
                pomelo.clientScene.gameInfoNode.onServerResponseFinish(data);
            break;
        case "endFinish":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else
                pomelo.clientScene.gameInfoNode.onServerEndFinish();
            break;
        case "updateDiamond":
            confige.curDiamond = data.data;
            if(confige.curSceneIndex == 1)
                pomelo.clientScene.updateDiamond();
            break;
        case "updateHistory":
            confige.curHistory = data.data;
            if(confige.curSceneIndex == 1)
                if(confige.curSceneIndex.historyLayer != -1)
                    pomelo.clientScene.updateHistory();
            break;
        case "updateGold":
            confige.curGold = data.data;
            console.log("updateGold num =====",confige.curGold);
            if(confige.curSceneIndex == 1)
                if(pomelo.clientScene.updateGold)
                    pomelo.clientScene.updateGold();
            break;
        case "downBanker":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                pomelo.clientScene.downBanker(data);
            }
            break;
        case "userDisconne":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else
                pomelo.clientScene.gamePlayerNode.userDisconne(confige.getCurChair(data.chair));
            break;
        case "userReconnection":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else{
                if(pomelo.clientScene.gamePlayerNode && pomelo.clientScene.gamePlayerNode.userReconnection)
                    pomelo.clientScene.gamePlayerNode.userReconnection(confige.getCurChair(data.chair));
                else
                    console.log("clientScene userReconnection not found!!!!!!!!!");
            }
            break;
        case "updatePlayerScore":
            if(confige.gameSceneLoadOver == false)
                confige.gameSceneLoadData.push(data);
            else
                pomelo.clientScene.gamePlayerNode.updateScoreByChair(data.chair,data.score);
            break;
        case "userOutRoom":
            if(confige.curSceneIndex == 2 && confige.goldNotEnoughOut == false)
                pomelo.clientScene.showGoldQuit();
            // if(data.reason == "notEnoughGold")
            break;
        case "give":
            pomelo.clientScene.gamePlayerNode.showGive(data);
            break;
        case "userReturn":
            // pomelo.clientScene.gameInfoNode.showReturn();
            if(confige.curSceneIndex == 2 && confige.goldNotEnoughOut == false)
                confige.quitToHallScene(true);
            break;
        case "signInAward":
            console.log("signInAward@@@@@@@@@!!!!!!!!");
            confige.signInAward = data.data;
            if(confige.curSceneIndex == 1)
                pomelo.clientScene.checkSignInAward();
            break;
        case "beginConsume":
            if(confige.curSceneIndex == 2)
                pomelo.clientScene.takeOutBasic(data.rate);
            break;
        case "lottoAward":
            if(confige.curSceneIndex == 2)
                pomelo.clientScene.lottoAward(data);
            break;
        case "beGive":
            if(confige.curSceneIndex == 1)
                pomelo.clientScene.beGive(data);
            break;
        case "canLotto":
            if(confige.curSceneIndex == 2)
                pomelo.clientScene.showLotto();
            break;
        case "newMail":
            if(confige.curSceneIndex == 1)
                if(pomelo.clientScene.newMail)
                    pomelo.clientScene.newMail.active = true;
            break;
        case "goldNotEnoughOut":
            confige.goldNotEnoughOut = true;
            pomelo.clientScene.gameInfoNode.showReturn();
            break;
        case "winCharge":
            if(confige.curSceneIndex == 2)
                pomelo.clientScene.winCharge(data.charge,data.chair);
            break;
        case "consume":
            if(confige.curSceneIndex == 2)
                pomelo.clientScene.endConsume(data.chargeList);
            break;
    }
};
        
pomelo.on("onNotify",function(data) {
    console.log("onNotify")
    console.log(data);
    pomelo.dealWithOnNotify(data);
    
});

pomelo.dealWithOnNotify = function(data){
    switch(data.type)
    {
        case "broadcast" :
            for(var i =0;i<3;i++)
            {
                pomelo.clientScene.paomaAddOneText(data.content);
            }
            break;
        case "rolling":
            // for(var i=0;i<data.count;i++)
            if(confige.curSceneIndex == 1 || confige.curSceneIndex == 2)
                pomelo.clientScene.paomaAddOneText(data.content,data.count);
            else
                confige.hallSceneLoadData.push(data);
            break;
        case "notify":
            if(confige.curSceneIndex == 1)
            {
                pomelo.clientScene.updateNotice(data.data);
            }else
                confige.hallSceneLoadData.push(data);
            break;
    }
};

pomelo.clientSend = function(code,msg,cbTrue,cbFalse) {
        pomelo.request("connector.entryHandler.sendData", {"code" : code,"params" : msg}, function(data) {
            console.log("on send!!!");
            console.log(data);
            if(data.flag == false)
            {
                if(cbFalse)
                    cbFalse();
                console.log(data);
                if(code == "join")
                {
                    console.log("join room ???")
                    if(data.msg && data.msg.code)
                    {
                        pomelo.clientScene.showTips(tipsConf[data.msg.code], 2);
                    }else{
                        pomelo.clientScene.showTips("加入房间失败,请重新输入!", 2);
                    }
                }
            }else{
                console.log("do clientSend cbTrue!!!!!!");
                if(cbTrue)
                    cbTrue();
            }
        }
    );
};

pomelo.clientCreateRoom = function(GameMode, BankerMode, ConsumeMode, GameNum, CardMode, PlayerNum, GameType, BasicScore, CreateType, HalfwayEnter, AllowAllin,AllowAward,AllowWait, cbTrue,cbFalse) {
        console.log("on create room!")
        var createType = CreateType;
        pomelo.request("connector.entryHandler.sendData", {"code" : createType,"params" : {gameMode: GameMode,
            bankerMode: BankerMode, consumeMode: ConsumeMode, gameNumber: GameNum, cardMode: CardMode, playerAmount: PlayerNum, gameType: GameType, basic: BasicScore, halfwayEnter: HalfwayEnter,allowAllin:AllowAllin,limitAward:AllowAward,isWait:AllowWait}}, function(data) {
            console.log("clientCreateRoom flag is : " + data.flag)
            console.log(data);
            if(data.flag == false)
            {
                if(cbFalse)
                    cbFalse();
                if(data.msg && data.msg.code)
                {
                    pomelo.clientScene.showTips(tipsConf[data.msg.code]);
                }else{
                    pomelo.clientScene.showTips("创建房间失败,请重新创建!");
                }
            }else{
                console.log("data.flag == true");
                if(cbTrue)
                    cbTrue();
                if(createType == "newRoom")
                    if(data.msg && data.msg.roomId)
                        pomelo.clientScene.showTips("创建房间成功!\n房间号为:" + data.msg.roomId, 1);
            }
        }
    );
};

pomelo.goldJoin = function() { 
    pomelo.request("connector.entryHandler.sendData", {"code" : "joinMatch","params" : {
        gameType: "goldMingpai"}}, function(data) {
          console.log("goldJoin flag is : "+data.flag)
        }
    );           
};

pomelo.goldLeave = function() { 
    pomelo.request("connector.entryHandler.sendData", {"code" : "leaveMatch","params" : {
        gameType: "goldMingpai"}}, function(data) {
          console.log("goldLeave flag is : "+data.flag)
        }
    );           
};

pomelo.goldQuite = function() { 
    pomelo.request("connector.entryHandler.sendData", {"code" : "userQuit"}, function(data) {
            console.log("goldQuiteflag is : "+data.flag)
            if(data.flag == true)
            {
                confige.quitToHallScene(true);
            }
        }
    );           
};

// confige.host = "39.108.144.235";     //测试外网
confige.host = "39.108.225.227";//"http://hly.5d8d.com";   //"39.108.225.227";     //运营外网
// confige.host = "192.168.1.65";       //内网
pomelo.clientLogin = function(uid,clientLogintoken) {
    console.log("pomelo try to login!!!!!!");
    var route = 'gate.gateHandler.queryEntry';
    pomelo.init({
      host: confige.host,
      port: "3900",
      log: true
    }, function() {
        
        pomelo.request(route, function(data) {
            pomelo.disconnect();
            if(data.code === 500) {
              console.log(data)
              return;
            }
            // confige.host = data.host;
            confige.port = data.port;
            confige.curUseId = uid;
            if(clientLogintoken)
                confige.curUseToken = clientLogintoken;
            if(confige.loginType == 0)
            {
                pomelo.loginWithHostAndPort(confige.host,data.port,uid);
            }else if(confige.loginType == 1){
                pomelo.loginWithHostAndPort(confige.host,data.port,uid,clientLogintoken);
            }else if(confige.loginType == 2){
                pomelo.loginWithHostAndPort(confige.host,data.port,-1,-1,confige.curUseCode);
            }
        });
    });
};
pomelo.connectCount = 3;
pomelo.loginWithHostAndPort = function(host, port, uid, token, code){
    pomelo.init({
            host: host,
            port: port,
            log: true
        }, function() {
        var route = "connector.entryHandler.visitorEnter";
        //注册事件
        if(confige.loginFirstTime == true)
        {
            confige.loginFirstTime = false;
            pomelo.on("disconnect",function(reason) {
                console.log("重连中!!!!!!");
                // pomelo.disconnect();
            });
            pomelo.on("close",function(){
                if(confige.curUsePlatform == 3){
                    if(pomelo.clientScene.showH5LoginError)
                        pomelo.clientScene.showH5LoginError();
                    else
                    {
                        console.log("1312312");
                        window.open(confige.h5LoginUrl);
                        window.close();
                    }
                    return;
                }
                console.log("你断线了!!!!!");
                if(confige.curSceneIndex != 0 && pomelo.clientScene.showReConnect)
                    pomelo.clientScene.showReConnect();
                if(pomelo.connectCount > 0)
                {
                    pomelo.connectCount --;
                    pomelo.disconnect();
                    pomelo.reConnet();
                }else{
                    console.log("强制关闭游戏,停止重连")
                }
            });
        }
        //转接登录逻辑
        if(confige.loginType == 0)
        {
            route = "connector.entryHandler.visitorEnter";
            pomelo.request(route,{"uid" : uid}, function(data) {
                if(data.error) {
                    console.log(data)
                    return;
                }
                pomelo.clientScene.connectCallBack();
                if(data.flag == true)
                {
                    if(confige.curSceneIndex != 0)
                        pomelo.clientScene.hideReConnect();
                    pomelo.connectCount = 3;

                    cc.sys.localStorage.setItem('lastLoginType', "traveler");
                }
            });
        }else if(confige.loginType == 1){
            route = "connector.entryHandler.enter";
            pomelo.request(route,{"openId" : uid, "token" : token, "version" : confige.versionCheck, "platform":confige.curUsePlatform}, function(data) {
                if(data.error) {
                    console.log(data)
                    return;
                }
                pomelo.clientScene.connectCallBack();
                if(data.code == -120)
                {
                    console.log("版本不对");
                    pomelo.clientScene.showVersionError();
                }
                if(data.flag == true){
                    pomelo.connectCount = 3;
                    confige.curUseId = uid;
                    confige.curUseToken = token;
                    if(confige.curSceneIndex != 0)
                        pomelo.clientScene.hideReConnect();

                    cc.sys.localStorage.setItem('lastLoginType', "wechat");
                }
            });
        }else if(confige.loginType == 2){
            route = "connector.entryHandler.h5Enter";
            pomelo.request(route,{"code" : code,"version" : confige.versionCheck, "platform":confige.curUsePlatform}, function(data) {
                console.log("h5Login！！！！！！！！")
                console.log(data);
                if(data.flag == false) {
                    console.log("登录失败,刷新页面!!!!!!")
                    if(pomelo.clientScene.showH5LoginError)
                        pomelo.clientScene.showH5LoginError();
                    else
                    {
                        console.log("1312312");
                        window.open(confige.h5LoginUrl);
                        window.close();
                    }
                    return;
                }
                pomelo.clientScene.connectCallBack();
                if(data.code == -120)
                {
                    console.log("版本不对");
                    pomelo.clientScene.showVersionError();
                }
                if(data.flag == true){
                    pomelo.request("connector.entryHandler.getTicket",null, function(data) {
                        console.log(data);
                        if(data.flag == true)
                        {
                            confige.h5SignTicket = data.jsapi_ticket;

                            console.log("wx.config begin!!!!!!!!!!!!!!!!!!");
                            confige.h5SignTime = Date.parse(new Date());
                            console.log("完整路径3333===="+confige.h5SignURL);
                            var originString = "jsapi_ticket="+confige.h5SignTicket+"&noncestr="+confige.h5SignStr+"&timestamp="+confige.h5SignTime+"&url="+confige.h5SignURL;
                            console.log("originString==="+originString);
                            var encodeString = hex_sha1(originString);
                            console.log("encodeString==="+encodeString);
                            confige.h5SignSignature = encodeString;
                            wx.config({
                                debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                                appId: confige.h5SignID, // 必填，企业号的唯一标识，此处填写企业号corpid
                                timestamp: confige.h5SignTime, // 必填，生成签名的时间戳
                                nonceStr: confige.h5SignStr, // 必填，生成签名的随机串
                                signature: confige.h5SignSignature,// 必填，签名，见附录1
                                jsApiList: [    "onMenuShareTimeline",
                                                "onMenuShareAppMessage",
                                                "chooseImage"] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                            });
                            console.log("wx.config end!!!!!!!!!!!!!!!!!!!!");

                        }
                        if(data.flag == false)
                            console.log("服务器出大问题了!!!!!!!!!");
                    });

                    pomelo.connectCount = 3;
                    if(confige.curSceneIndex != 0)
                        pomelo.clientScene.hideReConnect();
                }
            });
        }
    });
};        

pomelo.reConnet = function(){
    if(confige.curReconnectType == confige.ON_LOGIN)
        return;
    if(confige.loginType == 0)
        pomelo.loginWithHostAndPort(confige.host,confige.port,confige.curUseId);
    else if(confige.loginType == 1)
        pomelo.loginWithHostAndPort(confige.host,confige.port,confige.curUseId,confige.curUseToken);
    else if(confige.loginType == 2)
        pomelo.loginWithHostAndPort(confige.host,confige.port,-1,-1,confige.curUseCode);
    else if(confige.curUsePlatform == 3){
        window.open(confige.h5LoginUrl);
        window.close();
    }
};

pomelo.initGVoice = function(openID){
    var appid = "1664310387";
    var appkey = "5615341544b797ea39feecd758761ca7";
    var openid = openID;
    if(confige.GVoiceIsInit == false){
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JSCallJAVA", "GVioceInit", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", appid, appkey, openid);
        confige.GVoiceIsInit = true;
    }
    
},

pomelo.clientSaid = function(){
    cc.log("clientSaid");
    console.log("fuck !!!!!!!!!!!!!!!!!!");
}

pomelo.bindWX = function(openId,token){
    // jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JSCallJAVA", "JAVALog", "(Ljava/lang/String;)V", "pomelo.bindWX");
    pomelo.request("connector.account.bindWeiXinUnionid",{"openId" : openId, "token" : token}, function(data) {
        console.log("bindWeiXinUnionid@@@@@@@")
        console.log(data);
        // jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JSCallJAVA", "JAVALog", "(Ljava/lang/String;)V", "pomelo.bindWX.callBack");
        if(data.flag == true){
            // jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JSCallJAVA", "JAVALog", "(Ljava/lang/String;)V", "pomelo.bindWX.callBackTrue");
            cc.sys.localStorage.setItem('lastLoginType', "wechat");
            cc.game.restart();
        }
        if(data.code == 2)
        {
            pomelo.clientScene.showNewTips("微信信息不正确,请重试!");
        }else if(data.code == 3){
            pomelo.clientScene.showNewTips("该微信已绑定过账号,请重试!");
        }//1:不是游客账号;2:微信信息不正确;3:该微信已绑定过账号;
    });
}
