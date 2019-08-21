import phonebar from 'jssip-emicnet/dist/phonebar'
localStorage.setItem('debug', 'phonebar:*')
phonebar.log('正在获取用户信息。。。')
let un = 1002
let pwd = 'SMHgRu*3'
let switchnumber = '02180181735'
let gid = 21239
let calloutnumber = '10010'
let callinnumber = '1024'
let callfailedReason = {
    '470': '当前分机未绑定SIP话机',
    '471': 'SIP话机不在线',
    '486': 'SIP话机正忙',
    '503': '对方忙碌',
    '507': '总机号已停机',
    '508': '非工作时间',
    '512': '该客户今日被呼叫次数已达上限',
    '1000': '禁止拨打无权限坐席'
}

phonebar.getUser(
    un,
    pwd, //密码需要加引号
    switchnumber,
    (err, res) => {
        if (!err) {
            phonebar.log('获取用户信息,包含用户信息和组信息')
            let memberInfo = res
            phonebar.log('用户信息', memberInfo.userData)
            for (const group of memberInfo.inGroups) {
                phonebar.log('组信息', group)
                let gid = group.id
            }
            let params = {
                un: un,
                switchnumber: switchnumber,
                pwd: pwd,
                gid: gid
            }
            let eventCallback = {
                register: function(res) {
                    if (res.code == 200) {
                        phonebar.log('登录成功')
                        phonebar.log(phonebar.checkLogin())
                        setTimeout(() => {
                            phonebar.log(
                                '再次检查登录状态',
                                phonebar.checkLogin()
                            )
                        }, 1000)

                        setTimeout(() => {
                            // 登陆成功之后，可以呼出
                            // 呼外线
                            phonebar.call({
                                peerID: '9' + calloutnumber,
                                callType: 2
                            })
                            // 呼内线
                            // phonebar.call({
                            //     peerID: callinnumber,
                            //     callType: 3
                            // })
                        }, 2000)
                    }
                },
                callEvent: function(type, data) {
                    phonebar.log('callback:callEvent', type, data)
                    switch (type) {
                        case 'newPBXCall':
                            var ccNumber = data.c
                            var isAnswer = confirm('来电接听')
                            // 获取坐席状态
                            seatStatelog()
                            phonebar.log('是否接听', isAnswer)
                            if (!isAnswer) {
                                phonebar.terminate(ccNumber)
                            } else {
                                phonebar.answerPBXCall(ccNumber)
                            }
                            break
                        case 'cancelPBXCall':
                            break
                        case 'callinResponse':
                            if (data.r != 200) {
                                phonebar.log(`外呼内线响应状态${data.r}`)
                            }
                            // 获取坐席状态
                            seatStatelog()
                            break
                        case 'calloutResponse':
                            //获取ccnumber 通话唯一标识
                            var ccNumber = data.r == 200 ? data.c : undefined
                            if (data.r != 200) {
                                phonebar.log(`响应状态${data.r}`)
                                let msg = callfailedReason[data.r]
                                msg = msg || '呼叫失败'
                                phonebar.log(msg)
                            } else {
                                phonebar.log('呼叫成功', ccNumber)
                            }
                            break
                        case 'callinFaildResponse':
                            break
                        case 'answeredPBXCall':
                            // 获取坐席状态
                            seatStatelog()
                            var ccNumber = data.c ? data.c : undefined
                            // setTimeout(() => {
                            //     var isExist = confirm('坐席 1024 是否登陆')
                            //     if(!isExist) return
                            //     var isTransfer = confirm('是否转接')
                            //     if(!isTransfer) {
                            //         phonebar.terminate(ccNumber)
                            //     }else {
                            //         phonebar.transferPBXCall('2045','1024',ccNumber,function(type,data) {
                            //             if(res.type=='transferCallSuccess'){
                            //                 phonebar.log('transferCallSuccess')
                            //             }
                            //             if(res.type=='transferCallFaild'){
                            //                 phonebar.log('transferCallFaild')
                            //             }
                            //         })
                            //     }
                            // },20000)

                            setTimeout(() => {
                                // 呼叫保持后，对方会有语音提示
                                phonebar.hold(ccNumber)
                                // 获取坐席状态
                                seatStatelog()
                            }, 2000)

                            setTimeout(() => {
                                phonebar.unhold(ccNumber)
                                // 获取坐席状态
                                seatStatelog()
                            }, 10000)
                            break
                        case 'endPBXCall':
                            // 获取坐席状态
                            seatStatelog()
                            phonebar.log('通话结束')
                            break
                    }
                },
                kickedOffLine: function(type, data) {
                    console.log(type, data)
                },
                statusChanged: data => {
                    if (data.status == '0') {
                        phonebar.log('离线')
                    }
                    if (data.status == '1') {
                        phonebar.log('在线')
                    }
                    if (data.status == '2') {
                        phonebar.log('忙碌')
                    }
                }
            }
            phonebar.init(params, eventCallback)
        } else {
            phonebar.log('获取用户信息失败', err)
        }
    }
)

function seatStatelog(state) {
    var state = phonebar.checkSeatState()
    switch (state) {
        case 0:
            phonebar.log('当前坐席 离线')
            break
        case 1:
            phonebar.log('当前坐席 空闲')
            break
        case 2:
            phonebar.log('当前坐席 忙碌')
            break
        case 3:
            phonebar.log('当前坐席 振铃')
            break
        case 4:
            phonebar.log('当前坐席 通话')
            break
        case 5:
            phonebar.log('当前坐席 保持')
            break
    }
}
