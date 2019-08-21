import phonebar from 'jssip-emicnet/dist/phonebar'
localStorage.setItem('debug', 'phonebar:*')
phonebar.log('正在获取用户信息。。。')
phonebar.getUser(
    7034,
    '123456', //密码需要加引号
    '02566699734',
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
                un: '7034',
                switchnumber: '02566699734',
                pwd: '123456',
                gid: '0'
            }
            let eventCallback = {
                register: function(res) {
                    if (res.code == 200) {
                        phonebar.log('登录成功')
                        phonebar.log(phonebar.checkSeatState())
                        setTimeout(() => {
                            phonebar.log(
                                '再次检查登录状态',
                                phonebar.checkSeatState()
                            )
                        }, 1000)
                    }
                },
                callEvent: function(type, data) {
                    console.log(type, data)
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
            phonebar.log('获取用户信息失败')
        }
    }
)
