// import phonebar from 'jssip-emicnet/dist/phonebar'
import phonebar from '../JsSipWrap/dist/phonebar'
import isEqual from 'lodash.isequal'
import get from 'lodash.get'
localStorage.setItem('debug', 'phonebar:*,login:*,jsipWrapper:*')
// localStorage.setItem('debug', '*')
// url 不用以 '/'结尾，但是加了 '/' 也能处理
const backend = 'https://emic-cmb.emicloud.com'
phonebar.log('正在获取用户信息。。。')
let un = 7820
let pwd = '12345678'
let switchnumber = '02566687671'
let calloutnumber = '13910134045'
let callinnumber = '7821'
let callfailedReason = {
    '503': '对方忙碌',
    '507': '总机号已停机',
    '508': '非工作时间',
    '512': '该客户今日被呼叫次数已达上限',
    '1000': '禁止拨打无权限坐席',
}

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
                    phonebar.log(`2秒后呼叫保持`)
                    // 呼叫保持后，对方会有语音提示
                    phonebar.hold(ccNumber)
                    // 获取坐席状态
                    seatStatelog()
                }, 2000)

                setTimeout(() => {
                    phonebar.log(`10秒后呼叫恢复`)
                    phonebar.unhold(ccNumber)
                    // 获取坐席状态
                    seatStatelog()
                }, 10000)

                setTimeout(() => {
                    phonebar.log(`30秒后挂机`)
                    phonebar.terminate(ccNumber)
                }, 30000)
                break
            case 'endPBXCall':
                // 获取坐席状态
                seatStatelog()
                phonebar.log('通话结束')
                setTimeout(() => {
                    phonebar.log(`20秒后退出`)
                    phonebar.logout()
                }, 20000)
                break
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

let call_handler = async (err, resposne) => {
    if (err) {
        phonebar.log('获取用户信息失败', err)
        return
    }
    phonebar.log('获取用户信息,包含用户信息和组信息 ...')
    let userData = resposne
    let userData2 = JSON.parse(localStorage.userData)
    if (isEqual(userData, userData2)) {
        phonebar.log('正确获取了客户信息')
        // phonebar.log('用户信息', localStorage.userData)
    } else {
        phonebar.log('没能正确获取了客户信息，sdk代码有 bug!!')
        return
    }
    let gids = []
    for (const group of userData.groupInfo) {
        phonebar.log(`坐席所在组信息 ${group.name}, 技能组id ${group.gid}`)
        gids.push(group.gid)
    }
    let res = await phonebar.getGroups()
    if (!res) {
        phonebar.log('获取技能组失败', res)
        return
    }
    let onlines = res.data.filter((i) => {
        // 0 全离线 1 有空闲 2 全忙碌
        let state = get(i, 'group_real_time_state.state_id', 0)
        return state == 1
    })
    phonebar.log(
        `查询企业技能组信息，目前取了第${res.current_page}页数据，一共${res.last_page}页数据 ` +
            `当前页有${onlines.length}组坐席有空闲`
    )
    let members, mygroup
    for (const group of res.data) {
        let gstatus = group.group_real_time_state
        if (!gstatus) {
            phonebar.log(`${group.name} : ${group.id} 这是测试数据`)
            continue
        }
        phonebar.log(`${group.name} : ${group.gid} : ${gstatus.state_name}`)
        if (gids.includes(group.gid) && gstatus.state_id == 1) {
            phonebar.log(
                `坐席在这个组 ${group.gid} 目前有其他坐席在线,获取它的组员信息`
            )
            members = phonebar.getGroupMembers({ gid: group.gid })
            mygroup = group
        }
    }
    //current_page 是当前取了第几页数据，last_page是最后一页数据
    let pages = res.last_page
    phonebar.log(`一共有 ${pages} 页,示例再调用一次，取最后一页数据`)
    phonebar.getGroups(pages)
    if (members) {
        res = await members
        if (res.status == 200) {
            let seats = res.data[0]
            phonebar.log(
                `查询坐席所在 ${mygroup.name} 组成员成功返回 ${seats.seats.length} 人, 一共${seats.last_page}页数据 `
            )
            seats = seats.seats
            //成员状态 state_id 1 离线 2 在线
            onlines = seats.filter((i) => i.seat_real_time_state.state_id == 2)
            phonebar.log(`目前一共${onlines.length}人在线`)
            for (const member of seats) {
                let mstatus = member.seat_real_time_state
                phonebar.log(`${member.displayname} 状态 ${mstatus.state_name}`)
            }
        }
    } else {
        phonebar.log('坐席所在的技能组目前都没有其他坐席在线')
    }
    let params = {
        un: un,
        switchnumber: switchnumber,
        pwd: pwd,
        gid: mygroup.id, //sip注册用 id， web查询用 gid
    }
    // return
    phonebar.log('init 参数', params)
    //登录易米呼叫服务器
    let reg = phonebar.init(params, eventCallback)
    if (reg) {
        phonebar.log('phonebar.init 发起注册')
    } else {
        phonebar.log('phonebar.init 没有发起注册，参数有问题')
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
        backend,
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
