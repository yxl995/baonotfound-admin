import React, {Component} from 'react';
import {message, Statistic} from 'antd'
import {FileDoneOutlined, ShopOutlined, TeamOutlined} from '@ant-design/icons'
import Timer from "../Timer/Timer";
import {requestWithToken} from "../../network/request";
import {connect} from "react-redux";

class IndexTotal extends Component {

    state = {
        users_count: null,
        goods_count: null,
        order_count: null
    }

    componentDidMount() {
        if (this.props.user.token !== '')
            requestWithToken({
                url: '/api/admin/index'
            }, this.props.user.token).then(res => {
                this.setState(res.data)
            }).catch(() => {
                message.error('数据获取失败，请刷新')
            })
    }

    render() {
        const {users_count, goods_count, order_count} = this.state
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: "center"
            }}>
                <Timer style={{
                    width: '100%',
                    margin: '100px 0'
                }}/>
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-evenly',
                    margin: '100px 0'
                }}>
                    <Statistic title='用户数量' value={users_count} prefix={<TeamOutlined/>}
                               loading={users_count === null}/>
                    <Statistic title='商品数量' value={goods_count} prefix={<ShopOutlined/>}
                               loading={goods_count === null}/>
                    <Statistic title='订单数量' value={order_count} prefix={<FileDoneOutlined/>}
                               loading={order_count === null}/>
                </div>
            </div>
        )
    }
}

export default connect(
    state => ({user: state.user}),
    {}
)(IndexTotal)