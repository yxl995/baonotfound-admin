import React, {Component} from 'react';
import {Layout, Input, Button, Alert, message} from 'antd'
import {MailFilled, LockFilled} from '@ant-design/icons'
import logo from "../../imgs/logo.png";
import ICP_logo from '../../imgs/ICP_logo.png'
import {request} from "../../network/request";
import {connect} from "react-redux";
import {updateUserEmail, updateUserPassword, updateUserToken} from "../../redux/actions/user";

const {Header, Content} = Layout

class Login extends Component {

    state = {
        email: '',
        emailIsLegal: true,
        password: '',
        passwordIsLegal: true,
        loading: false
    }

    login = () => {
        const {email, emailIsLegal, password, passwordIsLegal} = this.state
        if (emailIsLegal && passwordIsLegal && email !== '' && password !== '') {
            this.setState({loading: true})
            request({
                url: '/api/auth/login',
                method: 'post',
                data: {
                    email,
                    password
                }
            }).then(res => {
                this.props.updateEmail(email)
                this.props.updatePassword(password)
                this.props.updateToken(res.data.access_token)
                message.success('登录成功', 1).then(() => this.props.history.push('/index'))
            }).catch(() => {
                message.error('邮箱或密码有误')
                this.setState({loading: false})
            })
        } else if (email === '' || password === '') message.error('邮箱或密码为空')
        else message.error('邮箱或密码格式错误')
    }

    emailInput = event => {
        const value = event.target.value
        this.setState({email: value})
        if (value === '') this.setState({emailIsLegal: true})
        else {
            let reg = /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.+com$/
            this.setState({emailIsLegal: reg.test(value)})
        }
    }

    passwordInput = event => {
        const value = event.target.value
        this.setState({password: value})
        if (value === '') this.setState({passwordIsLegal: true})
        else {
            let reg = /^[\S]{6,20}$/
            this.setState({passwordIsLegal: reg.test(value)})
        }
    }

    render() {
        return (
            <Layout>
                <Header style={{display: 'flex', justifyContent: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img style={{width: '30px', height: '30px'}} src={logo} alt="logo of web station"/>
                        <div style={{fontSize: '20px', color: 'white', marginLeft: '10px'}}>淘不到宝</div>
                    </div>
                </Header>
                <Content style={{height: 'calc(100vh - 114px)', position: 'relative'}}>
                    <div style={{
                        width: '600px',
                        position: 'absolute',
                        top: '120px',
                        left: 'calc(50vw - 300px)',
                        background: 'white',
                        borderRadius: '5px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingTop: '30px',
                        paddingBottom: '60px'
                    }}>
                        <h1 style={{fontWeight: 'bold'}}>登录</h1>
                        <Input style={{
                            width: '70%',
                            marginTop: '20px'
                        }} prefix={<MailFilled/>} placeholder="请输入邮箱" size='large' onChange={this.emailInput}/>
                        {
                            this.state.emailIsLegal ? <></> :
                                <Alert style={{
                                    width: '70%',
                                    marginTop: '5px',
                                    height: '30px',
                                    position: 'absolute',
                                    top: '130px',
                                    animation: 'antMoveUpIn 0.3s'
                                }} message="邮箱格式错误" type="error" showIcon/>
                        }
                        <Input.Password style={{
                            width: '70%',
                            marginTop: '40px'
                        }} prefix={<LockFilled/>} placeholder="请输入密码" size='large' onChange={this.passwordInput}
                                        onPressEnter={this.login}/>
                        {
                            this.state.passwordIsLegal ? <></> :
                                <Alert style={{
                                    width: '70%',
                                    marginTop: '5px',
                                    height: '30px',
                                    position: 'absolute',
                                    top: '210px',
                                    animation: 'antMoveUpIn 0.3s'
                                }} message='密码须由6-20位非空格字符组成' type="error" showIcon/>
                        }
                        <Button style={{
                            width: '70%',
                            marginTop: '40px',
                            background: 'black',
                            color: 'white',
                            border: "none",
                            fontWeight: 'bold'
                        }} type='primary' size='large' onClick={this.login} loading={this.state.loading}>登录</Button>
                    </div>
                </Content>
                <div style={{
                    height: '50px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <span>Bao Not Found ©2021 created by You Xi Long</span>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={ICP_logo} alt="ICP_logo"/>
                        <a style={{color: '#999999', textDecoration: 'underline'}} href='https://beian.miit.gov.cn'
                           target='_blank'
                           rel='noreferrer'>粤ICP备2021065603号</a>
                    </div>
                </div>
            </Layout>
        )
    }
}

export default connect(
    () => ({}),
    {
        'updateEmail': updateUserEmail,
        'updatePassword': updateUserPassword,
        'updateToken': updateUserToken
    }
)(Login)