import phonebar from 'jssip-emicnet/dist/phonebar'
// import phonebar from '../JsSipWrap/dist/phonebar'
import isEqual from 'lodash.isequal'
import get from 'lodash.get'
localStorage.setItem('debug', 'phonebar:*,login:*,ws:*')
// localStorage.setItem('debug', '*')
// url 不用以 '/'结尾，但是加了 '/' 也能处理
const backend = 'https://emicall-cmb.emicloud.com'
phonebar.log('正在获取用户信息。。。')
let un = 1002
let pwd = 'welcome123'
let switchnumber = '02566687671'
let calloutnumber = '95555' //拨打招行自助电话
let threeWayNumber = '95588' //工行自助电话
let callinnumber = '7821'
let baseParams = {
    un,
    pwd, //密码需要加引号
    switchnumber,
}
let gid = 0 //getGroup_demo 里获取

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
        } else {
            //res.info 是注册失败的原因说明，res.cause是错误码，
            //res.code为 403 或其他sip注册失败返回值
            phonebar.log(`${res.code}:${res.info}:${res.cause}`)
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
                    phonebar.log(`呼叫失败${data.r}:${data.info}`)
                }
                // 获取坐席状态
                seatStatelog()
                break
            case 'calloutResponse':
                //获取ccnumber 通话唯一标识
                var ccNumber = data.r == 200 ? data.c : undefined
                if (data.r != 200) {
                    //data.info 是呼叫失败的原因说明
                    phonebar.log(`呼叫失败${data.r}:${data.info}`)
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
                    phonebar.log(`2秒后呼叫保持`)
                    // 呼叫保持后，对方会有语音提示
                    phonebar.hold(ccNumber)
                    // 获取坐席状态
                    seatStatelog()
                }, 2000)

                setTimeout(() => {
                    phonebar.log(`4秒后呼叫恢复`)
                    phonebar.unhold(ccNumber)
                    // 获取坐席状态
                    seatStatelog()
                }, 4000)

                setTimeout(() => {
                    phonebar.log(`演示三方通话，最后挂机`)
                    threewayCallDemo(ccNumber)
                    // phonebar.terminate(ccNumber)
                }, 8000)
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
    threewayCall: function({ccNumber,result}) {
        phonebar.log(`3way call ${ccNumber}:result ${result}`)
        if (result == 0) {
            phonebar.log(`三方通话开始, please update the UI`)
            setTimeout(()=>{
                phonebar.log(`10秒后挂断和第三方的通话`)
                phonebar.threewayCall({ccNumber,type:4})
            },10000)
        } 
        if (result == 1) {
            this.log(`三方呼叫失败, please update the UI`)
        }
        if (result == 2) {
            this.log(`三方通话中，三方先挂机了, please update the UI`)
        }
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

async function threewayCallDemo(ccNumber) {
    phonebar.log(`invite ${threeWayNumber} to the call ${ccNumber}`)
    let {result,reason} = await phonebar.threewayCall({ccNumber,type:3,callee:threeWayNumber})
    if (result == 0) {
        phonebar.log(`我方服务器已经处理这个三方呼叫请求，开始向第三方发起呼叫，最终呼叫结果通过回调通知`)
        //查看 threewayCallResult 回调
    } else {
        phonebar.log(`我方服务器未能发起三方呼叫请求，原图: ${reaosn}, 请检查输入参数是否正确`)
    }
    setTimeout(()=>{
        phonebar.log(`25秒左右挂机 ${ccNumber}`)
        phonebar.terminate(ccNumber)
    },25000)
}

let getGroup_demo = async (response) => {
    phonebar.log('获取用户信息,包含用户信息和组信息 ...')
    let userData = response
    let userData2 = JSON.parse(localStorage.userData)
    if (isEqual(userData, userData2)) {
        phonebar.log('正确获取了客户信息')
        // phonebar.log('用户信息', localStorage.userData)
    } else {
        phonebar.log('没能正确获取了客户信息，sdk代码有 bug!!')
        return
    }
    let gids = [],
        mygroup = userData.groupInfo[0]
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
    let members
    for (const group of res.data) {
        let gstatus = group.group_real_time_state
        if (!gstatus) {
            phonebar.log(`${group.name} : ${group.gid} 这是测试数据`)
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
    if (mygroup && mygroup.gid) gid = mygroup.gid
}

let login_demo = () => {
    let params = Object.assign({ gid: gid }, baseParams)
    phonebar.log('init 参数', params)
    //登录易米呼叫服务器
    let reg = phonebar.init(params, eventCallback)
    if (reg) {
        phonebar.log('phonebar.init 发起注册')
    } else {
        phonebar.log('phonebar.init 没有发起注册，参数有问题')
    }
}

let callDemo = async (err, res) => {
    if (!err) {
        await getGroup_demo(res)
        phonebar.log(`获取坐席所在技能组id:${gid}`)
        //登录成功后会发起呼叫，详见 register() 回调方法
        login_demo()
    } else {
        phonebar.log('获取用户信息失败', err)
    }
}

let params = Object.assign(
    {
        backend,
        // callintype: 4,
        // number: 'xxxx', //设置回拨号码，注意 number是字符串
    },
    baseParams
)
phonebar.getUser2(params, callDemo)

// 原有接口 getUser 调用方式不变
// phonebar.getUser(
//     un,
//     pwd, //密码需要加引号
//     switchnumber,
//     call_handler
// )
