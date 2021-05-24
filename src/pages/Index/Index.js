import React, {Component, Suspense} from "react"
import {Layout, Menu, Button, message, Spin} from "antd"
import {
    BarChartOutlined,
    TeamOutlined,
    AppstoreOutlined,
    ShopOutlined,
    CommentOutlined,
    FileDoneOutlined,
    PictureOutlined,
    MinusCircleOutlined
} from '@ant-design/icons'
import {NavLink} from 'react-router-dom'
import logo from '../../imgs/logo.png'
import ICP_logo from '../../imgs/ICP_logo.png'
import {updateUserEmail, updateUserPassword, updateUserToken} from "../../redux/actions/user";
import {connect} from "react-redux";
import {requestWithToken} from "../../network/request";
import CacheRoute from "react-router-cache-route";

const IndexTotal = React.lazy(() => import('../../components/IndexTotal/IndexTotal'));
const User = React.lazy(() => import('../../components/User/User'));
const Category = React.lazy(() => import('../../components/Category/Category'));
const Comment = React.lazy(() => import('../../components/Comment/Comment'));
const Good = React.lazy(() => import('../../components/Good/Good'));
const Order = React.lazy(() => import('../../components/Order/Order'));
const Swiper = React.lazy(() => import('../../components/Swiper/Swiper'));

const {Header, Content, Sider} = Layout;

class Index extends Component {
    state = {
        username: null,
        loading: false
    }

    logout = () => {
        this.setState({loading: true})
        requestWithToken({
            url: '/api/auth/logout',
            method: 'post'
        }, this.props.user.token).then(() => {
            this.props.updateEmail('')
            this.props.updatePassword('')
            this.props.updateToken('')
            message.success('退出成功', 1).then(() => this.props.history.push('/'))
        }).catch(err => {
            message.error(err.response.data.message)
            this.setState({loading: false})
        })
    }

    componentDidMount() {
        if (this.props.user.token === '') message.error('请先登录', 1).then(() => this.props.history.push('/'))
        else
            requestWithToken({
                url: '/api/admin/user',
            }, this.props.user.token).then(res => {
                this.setState({username: res.data.name})
            }).catch(() => {
                message.error('用户名获取失败，请刷新重试')
            })
    }

    render() {
        return (
            <Layout style={{minHeight: '100vh'}}>

                <Header style={{
                    position: 'fixed',
                    zIndex: 100,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img style={{width: '30px', height: '30px'}} src={logo} alt="logo of web station"/>
                        <div style={{fontSize: '20px', color: 'white', marginLeft: '10px'}}>淘不到宝</div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        {
                            this.state.username === null ? null :
                                <div style={{
                                    color: 'white',
                                    animation: 'antMoveUpIn 0.3s'
                                }}>您好，{this.state.username}</div>
                        }
                        <Button type="text" style={{color: 'red'}} onClick={this.logout}
                                icon={<MinusCircleOutlined style={{color: 'red'}}/>} loading={this.state.loading}>
                            退出登录
                        </Button>
                    </div>
                </Header>

                <Layout style={{marginTop: '64px'}}>

                    <Sider style={{position: 'fixed', zIndex: 1, height: '100%', borderRight: '1px solid #eeeeee'}}
                           width='140'>
                        <Menu mode='inline' theme='dark'
                              defaultSelectedKeys={[this.props.location.pathname === '/index' ? '/index/' : this.props.location.pathname]}>
                            <Menu.Item style={{margin: '0'}} key="/index/" icon={<BarChartOutlined/>}>
                                <NavLink to='/index/' replace>首页统计</NavLink>
                            </Menu.Item>
                            <Menu.Item style={{margin: '0'}} key="/index/user" icon={<TeamOutlined/>}>
                                <NavLink to='/index/user' replace>用户管理</NavLink>
                            </Menu.Item>
                            <Menu.Item style={{margin: '0'}} key="/index/category" icon={<AppstoreOutlined/>}>
                                <NavLink to='/index/category' replace>分类管理</NavLink>
                            </Menu.Item>
                            <Menu.Item style={{margin: '0'}} key="/index/good" icon={<ShopOutlined/>}>
                                <NavLink to='/index/good' replace>商品管理</NavLink>
                            </Menu.Item>
                            <Menu.Item style={{margin: '0'}} key="/index/comment" icon={<CommentOutlined/>}>
                                <NavLink to='/index/comment' replace>评价管理</NavLink>
                            </Menu.Item>
                            <Menu.Item style={{margin: '0'}} key="/index/order" icon={<FileDoneOutlined/>}>
                                <NavLink to='/index/order' replace>订单管理</NavLink>
                            </Menu.Item>
                            <Menu.Item style={{margin: '0'}} key="/index/swiper" icon={<PictureOutlined/>}>
                                <NavLink to='/index/swiper' replace>轮播管理</NavLink>
                            </Menu.Item>
                        </Menu>
                    </Sider>

                    <Layout style={{marginLeft: '140px'}}>

                        <Content style={{width: '100%', height: '100%', padding: '10px 30px 0 30px'}}>
                            <div style={{width: '100%', height: '100%', background: 'white'}}>
                                <Suspense fallback={<Spin size='large' tip="Loading..."
                                                          style={{width: '100%', marginTop: '30vh'}}/>}>
                                    <CacheRoute path='/index/' exact component={IndexTotal}/>
                                    <CacheRoute path='/index/user' component={User}/>
                                    <CacheRoute path='/index/category' component={Category}/>
                                    <CacheRoute path='/index/good' component={Good}/>
                                    <CacheRoute path='/index/comment' component={Comment}/>
                                    <CacheRoute path='/index/order' component={Order}/>
                                    <CacheRoute path='/index/swiper' component={Swiper}/>
                                </Suspense>
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
                                <a style={{color: '#999999', textDecoration: 'underline'}}
                                   href='https://beian.miit.gov.cn'
                                   target='_blank'
                                   rel='noreferrer'>粤ICP备2021065603号</a>
                            </div>
                        </div>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}

export default connect(
    state => ({user: state.user}),
    {
        'updateEmail': updateUserEmail,
        'updatePassword': updateUserPassword,
        'updateToken': updateUserToken
    }
)(Index)