import phonebar from "jssip-emicnet/dist/phonebar";

console.log(phonebar);
phonebar.log("正在获取用户信息。。。");
phonebar.getUser(
  7034,
  "123456", //密码需要加引号
  "02566699734",
  (err, res) => {
    if (!err) {
      phonebar.log("获取用户信息,包含用户信息和组信息");
      let memberInfo = res;
      phonebar.log("用户信息", memberInfo.userData);
      for (const group of memberInfo.inGroups) {
        phonebar.log("组信息", group);
        let gid = group.id;
      }
      let params = {
        un: "7034",
        switchnumber: "02566699734",
        pwd: "123456",
        gid: "0"
      };
      let eventCallback = {
        register: function(res) {
          console.log(res);
        },
        callEvent: function(type, data) {
          console.log(type, data);
        },
        kickedOffLine: function(type, data) {
          console.log(type, data);
        }
      };
      phonebar.init(params, eventCallback);
    } else {
      phonebar.log("获取用户信息失败");
    }
  }
);
