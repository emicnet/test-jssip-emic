import phonebar from 'jssip-emicnet/dist/phonebar'
// import phonebar from '../JsSipWrap/dist/phonebar'
localStorage.setItem('debug', 'phonebar:*')

phonebar.log('正在获取用户信息。。。')
let un = 1000
let pwd = 'ceshi1000!'
let switchnumber = '02160469121'
let gid = 0
let calloutnumber = '95588'
let encrpyt = 'opwmRvGhOcGMXRZSp_moOQ'
let times = 0
let callinnumber = '1024'
let callfailedReason = {
    503: '对方忙碌',
    507: '总机号已停机',
    508: '非工作时间',
    512: '该客户今日被呼叫次数已达上限',
    1000: '禁止拨打无权限坐席',
}
let logoutTimer = -1

//演示代码，登录成功后发起呼叫
let eventCallback = {
    register: function (res) {
        if (res.code == 200) {
            phonebar.log('登录成功')
            phonebar.log(phonebar.checkLogin())
            setTimeout(() => {
                phonebar.log('再次检查登录状态', phonebar.checkLogin())
            }, 1000)

            setTimeout(() => {
                // 登陆成功之后，可以呼出
                // 呼外线
                let calltype = phonebar.call(calloutnumber)
                phonebar.log('呼' + (calltype == 2 ? '外线' : '内线'))
                // 呼内线
                // let calltype = phonebar.call(callinnumber)
                // phonebar.log('呼',(calltype ==2 ? "外线":"内线"))
            }, 2000)
        }
    },
    callEvent: function (type, data) {
        switch (type) {
            case 'newPBXCall':
                var ccNumber = data.c
                var isAnswer = confirm('来电接听')
                // 获取坐席状态
                seatStatelog()
                phonebar.log('是否接听', isAnswer)
                if (!isAnswer) {
                    phonebar.terminate(ccNumber)
                    phonebar.log(
                        '拒接，但请注意如果技能组只有本坐席在线，服务器还是打来'
                    )
                } else {
                    phonebar.answerPBXCall(ccNumber)
                }
                break
            case 'cancelPBXCall':
                phonebar.log(
                    '坐席拒接确认；如果坐席未接但主叫挂机也会有这个消息'
                )
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
                    setTimeout(() => {
                        phonebar.log(`10秒后退出`)
                        phonebar.logout()
                    }, 10000)
                } else {
                    phonebar.log('服务器处理呼叫请求', data)
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
                    phonebar.log(`呼叫保持`)
                    seatStatelog()
                }, 2000)

                setTimeout(() => {
                    phonebar.unhold(ccNumber)
                    // 获取坐席状态
                    phonebar.log(`取消呼叫保持`)
                    seatStatelog()
                }, 10000)

                setTimeout(() => {
                    phonebar.log(`30秒已过，挂机`)
                    phonebar.terminate(ccNumber)
                }, 30000)
                phonebar.log(`2秒设置呼叫保持，10秒后回复，30秒后挂机`)
                break
            case 'endPBXCall':
                // 获取坐席状态
                seatStatelog()
                phonebar.log('通话结束，等待10秒 下一个演示 ...')
                setTimeout(() => {
                    if (times == 1) {
                        phonebar.log(
                            `已经呼叫过 ${encrpyt} 这时候可以尝试呼入，呼入拒接则演示退出`
                        )
                        if (logoutTimer != -1) {
                            phonebar.log(`已经设置退出timer，所以直接返回`)
                            return
                        }
                        logoutTimer = setTimeout(() => {
                            phonebar.log(`已过10分钟，退出登录`)
                            phonebar.logout()
                        }, 1000 * 60 * 10)
                    } else {
                        phonebar.log(`呼叫 ${encrpyt}`)
                        phonebar.call(encrpyt, 'encrpyt')
                        times = 1
                    }
                }, 10000)
                break
            // default:
            //     phonebar.log('这是sip相关信息，使用者可以不关心')
            //     phonebar.log('callback:callEvent', type, data)
        }
    },
    kickedOffLine: function (data) {
        phonebar.log(data)
        phonebar.log(
            '收到下线消息，账户也会被强制下线，这时候只需要更新相应UI就可以'
        )
        phonebar.logout()
    },
    statusChanged: (data) => {
        if (data.status == '0') {
            phonebar.log('离线')
        }
        if (data.status == '1') {
            phonebar.log('在线')
        }
        if (data.status == '2') {
            phonebar.log('忙碌')
        }
    },
}

let call_handler = async (err, res) => {
    if (!err) {
        phonebar.log('获取用户信息,包含用户信息和组信息')
        let memberInfo = res
        phonebar.log('用户信息', memberInfo.userData)
        for (const group of memberInfo.inGroups) {
            phonebar.log('组信息', group)
            //调用init需要设置,如果在多个组，登录时就取最后一个组
            gid = group.id
        }
        var userData = JSON.parse(localStorage.userData)
        var webParam = {
            un,
            pwd,
            eid: userData.eid,
            //eid: '6565' //不存在eid res.status 50008
        }
        var res = await phonebar.webApiHandler('getGroups', webParam)
        if (res.status == 200) {
            phonebar.log('获取了所有技能组:')
            for (const group of res.returnData) {
                //{group.id, group.eid, group.name}
                phonebar.log(`${group.name} : ${group.id}`)
            }
            const gn = res.returnData[0].name
            const gi = res.returnData[0].id
            webParam.searchGid = gi //'1000000015'
            webParam.length = 10
            var res = await phonebar.webApiHandler('searchEpMembers', webParam)
            if (res.status == 200) {
                phonebar.log(
                    `查询${gn} 组成员成功返回 ${res.returnData.recordsTotal} 人`,
                    res
                )
                for (const member of res.returnData.data) {
                    //会话状态   0 离线  1 空闲  2 忙碌
                    phonebar.log(
                        `${member.displayname} 状态 ${member.kefuStatus}`
                    )
                }
            }
        } else {
            phonebar.log('获取技能组失败', res)
        }

        let params = {
            un: un,
            switchnumber: switchnumber,
            pwd: pwd,
            gid: gid,
            //webrtc-dev.emicloud.com是演示服务器，实际使用请不要用它
            socketUri: 'wss://webrtc-dev.emicloud.com:9060',
        }
        //登录易米呼叫服务器
        let reg = phonebar.init(params, eventCallback)
        if (reg) {
            phonebar.log('phonebar.init 发起注册')
        } else {
            phonebar.log('phonebar.init 没有发起注册，参数有问题')
        }
    } else {
        phonebar.log('获取用户信息失败', err)
    }
}

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

phonebar.getUser2(
    {
        un,
        pwd, //密码需要加引号
        switchnumber,
        // callintype: 5,
        // number: 10000,
    },
    call_handler
)

// 原有接口 getUser 调用方式不变
// phonebar.getUser(
//     un,
//     pwd, //密码需要加引号
//     switchnumber,
//     call_handler
// )
