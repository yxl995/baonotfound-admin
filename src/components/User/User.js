import React, {Component} from 'react';
import {Button, message, Table, Form, Input, Popconfirm, Modal, Typography} from "antd";
import {PlusCircleOutlined} from '@ant-design/icons'
import {requestWithToken} from "../../network/request";
import {connect} from "react-redux";

class User extends Component {

    emailRules = {
        pattern: /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.+com$/,
        message: '请输入合法格式的邮箱'
    }
    phoneRules = {
        pattern: /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/,
        message: '请输入合法的手机号'
    }
    passwordRules = {
        pattern: /^[\S]{6,20}$/,
        message: '密码须由6-20位非空格字符组成'
    }

    resetBtn1 = React.createRef()
    resetBtn2 = React.createRef()

    state = {
        total: 0,
        columns: [{
            title: <Button onClick={() => this.setState({isAdd: true})} type={'primary'}
                           icon={<PlusCircleOutlined/>} size={'large'}>添加用户</Button>,
            dataIndex: 'avatar_url',
            align: 'center',
            width: 200
        }, {
            title: '昵称',
            dataIndex: 'name',
            align: 'center',
            width: 250
        }, {
            title: '邮箱',
            dataIndex: 'email',
            align: 'center',
            width: 250
        }, {
            title: '手机',
            dataIndex: 'phone',
            align: 'center',
            width: 200
        }, {
            title: '操作',
            dataIndex: 'action',
            align: 'center',
            width: 200
        }],
        userList: [],
        loading: false,
        name: '',
        email: '',
        phone: '',
        emailIsLegal: true,
        phoneIsLegal: true,
        current: 1,
        addName: '',
        addEmail: '',
        addPassword: '',
        checkPassword: '',
        addEmailIsLegal: false,
        addPasswordIsLegal: false,
        isAdd: false,
        editFinished: false,
        editName: '',
        editEmail: '',
        editID: '',
        editType: ''
    }

    componentDidMount() {
        this.queryUsers()
    }

    lockOrUnlock = id => {
        requestWithToken({
            url: `/api/admin/users/${id}/lock`,
            method: 'patch'
        }, this.props.user.token).then(res => {
            if (res.status === 204) {
                this.queryUsers(this.state.current)
                message.success('操作成功')
            }
        }).catch(() => {
            message.error('操作失败，请重试')
        })
    }

    finishEdit = (event, id, type) => {
        const {userList} = this.state
        const item = userList[userList.findIndex(item => item.key === id)]
        if ((event !== item.nameData && type === 'name') || (event !== item.emailData && type === 'email')) {
            let newState = {
                editFinished: true,
                editID: id,
                editType: type
            }
            if (type === 'name') newState['editName'] = event
            else newState['editEmail'] = event
            this.setState(newState)
        }
    }

    updateUser = () => {
        const {editName, editEmail, editID, editType, userList, current} = this.state
        let flag = editType === 'name' ? editName !== '' : this.emailRules.pattern.test(editEmail)
        if (flag) {
            this.setState({loading: true})
            requestWithToken({
                url: `/api/admin/users/${editID}`,
                method: 'put',
                data: {
                    name: editType === 'name' ? editName : userList[userList.findIndex(item => item.key === editID)].nameData,
                    email: editType === 'email' ? editEmail : userList[userList.findIndex(item => item.key === editID)].emailData
                }
            }, this.props.user.token).then(() => {
                this.setState({loading: false, editFinished: false}, () => {
                    message.success('更新成功')
                    this.queryUsers(current)
                })
            }).catch(() => {
                this.setState({loading: false, editFinished: false})
                message.error('更新失败，请重试')
            })
        } else {
            this.setState({editFinished: false})
            message.error('请输入正确信息')
        }
    }

    queryUsers = (current = 1) => {
        const {emailIsLegal, phoneIsLegal} = this.state
        if (emailIsLegal && phoneIsLegal) {
            this.setState({loading: true})
            const {name, email, phone} = this.state
            requestWithToken({
                url: '/api/admin/users',
                params: {
                    current,
                    name,
                    email,
                    phone,
                }
            }, this.props.user.token).then(res => {
                let userList = []
                res.data.data.forEach(item => {
                        let obj = {
                            key: item.id,
                            name: <Typography.Text editable={{onChange: event => this.finishEdit(event, item.id, 'name')}}
                                                   style={{width: '200px', margin: '0 auto'}}>{item.name}</Typography.Text>,
                            nameData: item.name,
                            email: <Typography.Text editable={{onChange: event => this.finishEdit(event, item.id, 'email')}}
                                                    style={{
                                                        width: '200px',
                                                        margin: '0 auto'
                                                    }}>{item.email}</Typography.Text>,
                            emailData: item.email,
                            phone: item.phone,
                            avatar_url: <img style={{width: '40px', height: '40px', borderRadius: '50%'}}
                                             src={item.avatar_url} alt='user_avatar'/>,
                            is_locked: item.is_locked,
                            action: <Popconfirm title="确定要进行操作吗?" onConfirm={() => this.lockOrUnlock(item.id)}>
                                {
                                    item.is_locked === 1 ?
                                        <Button type='text' style={{color: 'red'}}>解封</Button> :
                                        <Button type='text' style={{color: 'deepskyblue'}}>封禁</Button>
                                }
                            </Popconfirm>
                        }
                        userList.push(obj)
                    }
                )
                this.setState({
                        userList,
                        total: res.data.meta.pagination.total
                    }
                )
            }).catch(() => {
                    message.error('查找失败', 1)
                }
            ).finally(() => this.setState({loading: false}))
        } else message.error('请输入合法查询条件')
    }

    pageChange = pageNumber => {
        this.setState({current: pageNumber})
        this.queryUsers(pageNumber)
    }

    nameInputChange = event => {
        this.setState({name: event.target.value})
    }

    emailInputChange = event => {
        this.setState({email: event.target.value}, () => {
            if (this.state.email === '') this.setState({emailIsLegal: true})
            else {
                let reg = /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.+com$/
                this.setState({emailIsLegal: reg.test(this.state.email)})
            }
        })
    }

    phoneInputChange = event => {
        this.setState({phone: event.target.value}, () => {
            if (this.state.phone === '') this.setState({phoneIsLegal: true})
            else {
                let reg = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/
                this.setState({phoneIsLegal: reg.test(this.state.phone)})
            }
        })
    }

    addNameChange = event => {
        this.setState({addName: event.target.value})
    }

    addEmailChange = event => {
        this.setState({addEmail: event.target.value}, () => {
            if (this.state.addEmail === '') this.setState({addEmailIsLegal: false})
            else {
                let reg = /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.+com$/
                this.setState({addEmailIsLegal: reg.test(this.state.addEmail)})
            }
        })
    }

    addPasswordChange = event => {
        this.setState({addPassword: event.target.value}, () => {
            if (this.state.addPassword === '') this.setState({addPasswordIsLegal: false})
            else {
                let reg = /^[\S]{6,20}$/
                this.setState({addPasswordIsLegal: reg.test(this.state.addPassword)})
            }
        })
    }

    checkPasswordChange = event => {
        this.setState({checkPassword: event.target.value})
    }

    toAdd = () => {
        if (this.state.isAdd) this.addUser()
        else this.setState({isAdd: true})
    }

    addUser = () => {
        const {addName, addEmail, addPassword, checkPassword, addEmailIsLegal, addPasswordIsLegal} = this.state
        if (addName !== '' && addEmailIsLegal && addPasswordIsLegal && addPassword === checkPassword) {
            this.setState({loading: true})
            requestWithToken({
                url: '/api/admin/users',
                method: 'post',
                data: {
                    name: addName,
                    email: addEmail,
                    password: addPassword
                }
            }, this.props.user.token).then(() => {
                this.setState({loading: false, current: 1})
                this.cancelAddUser()
                this.resetQuery()
                message.success('添加成功')
                setTimeout(this.queryUsers, 300)
            }).catch(() => {
                this.setState({loading: false})
                message.error('添加失败，请重试')
            })
        } else message.error('请正确填写信息')
    }

    cancelAddUser = () => {
        this.resetBtn2.current.click()
        this.setState({
            addName: '',
            addEmail: '',
            addPassword: '',
            checkPassword: '',
            addEmailIsLegal: false,
            addPasswordIsLegal: false,
            isAdd: false
        })
    }

    resetQuery = () => {
        this.resetBtn1.current.click()
        this.setState({
            name: '',
            email: '',
            phone: '',
            emailIsLegal: true,
            phoneIsLegal: true
        })
    }

    render() {
        const {columns, userList, total, loading, email, phone, current, isAdd, addPassword, editFinished} = this.state
        return (
            <div style={{width: "100%"}}>
                <Form layout={'inline'} colon={false}
                      style={{display: 'flex', justifyContent: 'space-between', padding: '10px'}}>
                    <Form.Item label={'昵称(可选)'} labelCol={{offset: 1}} name={'name'}>
                        <Input allowClear placeholder={'请输入用户昵称'} onChange={this.nameInputChange}/>
                    </Form.Item>
                    <Form.Item label={'邮箱(可选)'} name={'email'}
                               hasFeedback={email === '' ? false : true}
                               rules={[this.emailRules]}>
                        <Input allowClear placeholder={'请输入用户邮箱'} onChange={this.emailInputChange}/>
                    </Form.Item>
                    <Form.Item label={'手机(可选)'} name={'phone'}
                               hasFeedback={phone === '' ? false : true}
                               rules={[this.phoneRules]}>
                        <Input allowClear placeholder={'请输入用户手机号'} onChange={this.phoneInputChange}/>
                    </Form.Item>
                    <Form.Item>
                        <Button style={{marginRight: '10px'}} onClick={this.resetQuery}>重置</Button>
                        <Button htmlType={'reset'} ref={this.resetBtn1}
                                style={{position: "absolute", top: 0}}/>
                        <Button type={'primary'}
                                onClick={() => {
                                    this.setState({current: 1}, this.queryUsers)
                                }}
                                loading={loading}>查询</Button>
                    </Form.Item>
                </Form>

                <Table columns={columns} dataSource={userList} loading={loading}
                       pagination={{
                           position: ['bottomCenter'],
                           total,
                           current,
                           showSizeChanger: false,
                           hideOnSinglePage: true,
                           showLessItems: true,
                           showQuickJumper: true,
                           onChange: this.pageChange
                       }}/>
                <Modal title="新增用户信息" visible={isAdd} closable={false} footer={null} style={{textAlign: 'center'}}>
                    <Form size={'large'} style={{textAlign: 'initial'}}>
                        <Form.Item label={'昵称'} name={'name'}
                                   rules={[{required: true}]}
                                   hasFeedback>
                            <Input allowClear placeholder={'请输入新用户昵称'} onChange={this.addNameChange}/>
                        </Form.Item>
                        <Form.Item label={'邮箱'} name={'email'}
                                   rules={[{required: true}, this.emailRules]}
                                   hasFeedback>
                            <Input allowClear placeholder={'请输入新用户邮箱'} onChange={this.addEmailChange}/>
                        </Form.Item>
                        <Form.Item label={'密码'} name={'password'}
                                   rules={[{required: true}, this.passwordRules]}
                                   hasFeedback>
                            <Input.Password allowClear placeholder={'请输入新用户密码'} onChange={this.addPasswordChange}/>
                        </Form.Item>
                        <Form.Item label={'确认密码'} name={'checkPassword'}
                                   rules={[{required: true, message: '请再次确认密码'}, {
                                       validator: (_, value) =>
                                           value !== ''
                                               ? value === addPassword
                                               ? Promise.resolve()
                                               : Promise.reject(new Error('两次密码不一致'))
                                               : Promise.reject()
                                   }]}
                                   hasFeedback>
                            <Input.Password allowClear placeholder={'请再次确认密码'} onChange={this.checkPasswordChange}/>
                        </Form.Item>
                        <Form.Item>
                            <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                                <Button htmlType={'reset'} ref={this.resetBtn2}
                                        style={{position: 'absolute', top: 0}}/>
                                <Button style={{marginRight: '10px', width: '20%'}}
                                        onClick={this.cancelAddUser}>取消</Button>
                                <Button style={{width: '20%'}} onClick={this.toAdd}
                                        type={'primary'} loading={loading}>添加</Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal title="确认要修改吗？" visible={editFinished}
                       closable={false} footer={null} style={{textAlign: 'center'}}>
                    <Button style={{marginRight: '10px'}}
                            onClick={() => this.setState({editFinished: false})}>取消</Button>
                    <Button style={{marginLeft: '10px'}} onClick={this.updateUser}
                            type={'primary'} loading={loading}>确定</Button>
                </Modal>
            </div>
        )
    }
}

export default connect(
    state => ({user: state.user}),
    {}
)(User)