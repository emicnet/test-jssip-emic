import phonebar from 'jssip-emicnet/dist/phonebar'
// import phonebar from '../JsSipWrap/dist/phonebar'
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
        }
    },
    callEvent: function (type, data) {
        log(`callback:callEvent, ${type}`)
        log(data)
        let s = phonebar.monitorStatus
        switch (type) {
            case 'answeredPBXCall':
                if (s.ccNumber == data.c)
                    log('这是监听相关呼叫消息，这里可以直接忽略')
                break
            case 'endPBXCall':
                log('停止监听也会收到endPBXCall消息，这里可以直接忽略')
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
            log(`注意，5 秒后开始监控`)
            setTimeout(demoMonitor, 5000)
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
        }
        log(`目前本组有 ${Object.keys(repcalls).length} 个呼叫`)
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

function demoMonitor() {
    let calles = Object.keys(repcalls)
    if (calles.length == 0) {
        log(`本组目前没有通话`)
        return
    }
    let rep = calles[0]
    let repData = repcalls[rep]
    log(`首先静音监听 ${rep} 目前通话 ${repData.ccNumber}`)
    let monitorStatus = phonebar.checkMonitorState()
    log(`开始前监听状态值是 ${JSON.stringify(monitorStatus)}`)
    phonebar.startCallMonitor(repData.ccNumber, (result) => {
        if (result != 0) {
            log(`监听失败`)
            return
        }
        monitorStatus = phonebar.checkMonitorState()
        log(
            `监听开始，目前的监听状态值是 ${JSON.stringify(
                monitorStatus
            )}, 30秒后退出监听`
        )
        setTimeout(demoStopMonitor, 30000, repData.ccNumber, demoJoin)
    })
}

function demoStopMonitor(ccNumber, next) {
    phonebar.stopCallMonitor(ccNumber, (result) => {
        if (result != 0) {
            log(`退出监听失败`)
            return
        }
        let monitorStatus = phonebar.checkMonitorState()
        log(
            `退出监听, 目前的监听状态值是 ${JSON.stringify(
                monitorStatus
            )} 10 秒后开始演示 监听和三方通话`
        )
        setTimeout(next, 10000, ccNumber)
    })
}

function demoJoin(ccNumber) {
    //辅助函数，做流程控制，三方通话先要经过监听
    function flowControl(afterJoin) {
        phonebar.startCallMonitor(ccNumber, (result) => {
            if (result != 0) return
            let monitorStatus = phonebar.checkMonitorState()
            log(
                `要进入三方通话，首先要处在监听状态，目前的监听状态值是 ${JSON.stringify(
                    monitorStatus
                )}, 20秒后进入三方通话`
            )
            setTimeout(join, 20000, ccNumber, afterJoin)
        })
    }
    function join(ccNumber, next) {
        phonebar.joinFromMonitor(ccNumber, (result) => {
            if (result != 0) {
                log(`加入三方会议失败`)
                return
            }
            let monitorStatus = phonebar.checkMonitorState()
            log(
                `三方会议中, 目前的监听状态值是 ${JSON.stringify(
                    monitorStatus
                )} 30秒后结束三方通话`
            )
            setTimeout(next, 30000, ccNumber)
        })
    }
    log(`先演示加入三方，从三方退出；1分钟后再演示加入三方，然后结束整个通话`)
    flowControl(demoExitJoin)
    setTimeout(flowControl, 60000, demoEndJoin)
}

function demoExitJoin(ccNumber) {
    phonebar.exitJoinMonitor(ccNumber, (result) => {
        if (result != 0) {
            log(`退出三方通话失败`)
            return
        }
        let monitorStatus = phonebar.checkMonitorState()
        log(
            `已从三方会议退出, 目前的监听状态值是 ${JSON.stringify(
                monitorStatus
            )} `
        )
    })
}

function demoEndJoin(ccNumber) {
    phonebar.endCallMonitor(ccNumber, (result) => {
        if (result != 0) {
            log(`结束三方通话失败`)
            return
        }
        let monitorStatus = phonebar.checkMonitorState()
        log(
            `结束三方会议, 目前的监听状态值是 ${JSON.stringify(monitorStatus)} `
        )
    })
}

phonebar.getUser2(
    {
        un,
        pwd, //密码需要加引号
        switchnumber,
    },
    call_handler
)
