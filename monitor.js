// import phonebar from 'jssip-emicnet/dist/phonebar'
import phonebar from '../JsSipWrap/dist/phonebar'
import debug from 'debug'
localStorage.setItem('debug', 'phonebar:*')

let log = debug('phonebar:monitor')

log('正在获取用户信息。。。')
let un = 1006
let pwd = '1006'
let switchnumber = '02566699734'
let gid = 0

let callfailedReason = {
    503: '对方忙碌',
    507: '总机号已停机',
    508: '非工作时间',
    512: '该客户今日被呼叫次数已达上限',
    1000: '禁止拨打无权限坐席',
}

let repcalls = {} //用来保存坐席的通话

//班长监控演示代码，登录成功后等待组员发起呼叫，然后实时监控
let eventCallback = {
    register: function (res) {
        if (res.code == 200) {
            log('登录成功，等待坐席的呼叫通知')
            log(phonebar.checkLogin())

            setTimeout(() => {
                // 登陆成功之后，开始监控
            }, 2000)
        }
    },
    callEvent: function (type, data) {
        log('callback:callEvent', type, data)
        switch (type) {
            case 'newPBXCall':
                var ccNumber = data.c
                var isAnswer = confirm('来电接听')
                // 获取坐席状态
                seatStatelog()
                log('是否接听', isAnswer)
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
                    log(`外呼内线响应状态${data.r}`)
                }
                // 获取坐席状态
                seatStatelog()
                break
            case 'calloutResponse':
                //获取ccnumber 通话唯一标识
                var ccNumber = data.r == 200 ? data.c : undefined
                if (data.r != 200) {
                    log(`响应状态${data.r}`)
                    let msg = callfailedReason[data.r]
                    msg = msg || '呼叫失败'
                    log(msg)
                    setTimeout(() => {
                        log(`10秒后退出`)
                        phonebar.logout()
                    }, 10000)
                } else {
                    log('服务器处理呼叫请求', data)
                }
                break
            case 'callinFaildResponse':
                break
            case 'answeredPBXCall':
                // 获取坐席状态
                seatStatelog()
                var ccNumber = data.c ? data.c : undefined
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

                setTimeout(() => {
                    log(`30秒后挂机`)
                    phonebar.terminate(ccNumber)
                }, 30000)
                break
            case 'endPBXCall':
                // 获取坐席状态
                seatStatelog()
                log('通话结束')
                setTimeout(() => {
                    log(`20秒后退出`)
                    phonebar.logout()
                }, 20000)
                break
        }
    },
    kickedOffLine: function (data) {
        log(
            `收到下线消息，账户也会被强制下线，这时候只需要更新相应UI就可以;` +
                `下线原因${JSON.stringify(data)}`
        )
        phonebar.logout()
    },
    statusChanged: (data) => {
        if (data.status == '0') {
            log('离线')
        }
        if (data.status == '1') {
            log('在线')
        }
        if (data.status == '2') {
            log('忙碌')
        }
    },
    //接口组员通话通知，通话开始一次，结束一次
    /**
     *  let data = {
            caller,
            ccNumber,
            callee,
            callTime,
            endTime
        }
     */
    repCallStatus: (data) => {
        let record = repcalls[data.caller]
        if (!record) {
            //没有记录，所以是发起呼叫通知
            if (data.endTime != '' || !data.ccNumber || !data.callTime) {
                log(`坐席呼叫通知数据有误 ${JSON.stringify(data)}`)
                return
            }
            let callTime = new Date(data.callTime * 1000)
            log(
                `${data.caller} 在 ${callTime.toLocaleString()} 呼叫 ${
                    data.callee
                }`
            )
            repcalls[data.caller] = data
        } else {
            //有记录，所以是结束呼叫通知
            if (
                !data.endTime ||
                data.ccNumber != record.ccNumber ||
                data.callTime != record.callTime
            ) {
                log(`坐席呼叫通知数据有误 ${JSON.stringify(data)}`)
            } else {
                let endTime = new Date(data.endTime * 1000)
                log(
                    `${data.caller} 在 ${endTime.toLocaleString()} 结束呼叫 ${
                        data.callee
                    }`
                )
            }
            delete repcalls[data.caller]

            log(`目前本组有 ${Object.keys(repcalls).length} 个呼叫`)
        }
    },
}

let call_handler = async (err, res) => {
    if (err) {
        log('获取用户信息失败', err)
        return
    }
    log('获取用户信息,包含用户信息和组信息')
    let memberInfo = res
    log('用户信息', memberInfo.userData)
    for (const group of memberInfo.inGroups) {
        log('组信息', group)
        //调用init需要设置,如果在多个组，演示登录时就取最后一个组
        gid = group.id
    }
    var userData = JSON.parse(localStorage.userData)

    let params = {
        un: un,
        switchnumber: switchnumber,
        pwd: pwd,
        gid: gid,
        socketUri: 'wss://webrtc-dev.emicloud.com:9060',
    }
    //登录易米呼叫服务器
    let reg = phonebar.init(params, eventCallback)
    if (reg) {
        log('phonebar.init 发起注册，注册结果在回调中通知')
    } else {
        log('phonebar.init 没有发起注册，参数有问题')
    }
}

function seatStatelog(state) {
    var state = phonebar.checkSeatState()
    switch (state) {
        case 0:
            log('当前坐席 离线')
            break
        case 1:
            log('当前坐席 空闲')
            break
        case 2:
            log('当前坐席 忙碌')
            break
        case 3:
            log('当前坐席 振铃')
            break
        case 4:
            log('当前坐席 通话')
            break
        case 5:
            log('当前坐席 保持')
            break
    }
}

phonebar.getUser2(
    {
        un,
        pwd, //密码需要加引号
        switchnumber,
    },
    call_handler
)
