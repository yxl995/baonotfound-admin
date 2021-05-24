import React, {Component} from 'react';
import {connect} from "react-redux";
import {Button, Divider, Form, Input, message, Modal, Select, Table, Tag} from "antd";
import {requestWithToken} from "../../network/request";

class Order extends Component {

    resetQueryBtn = React.createRef()
    resetPostBtn = React.createRef()

    state = {
        columns: [{
            title: '订单号',
            dataIndex: 'order_no',
            align: 'center'
        }, {
            title: '支付流水号',
            dataIndex: 'trade_no',
            align: 'center',
            render: text => text === null ? '无' : text
        }, {
            title: '订单状态',
            dataIndex: 'status',
            align: 'center',
            render: text =>
                <Tag
                    color={text === 1 ? '#FFCC00' : text === 2 ? '#FF3300' : text === 3 ? '#3399FF' : text === 4 ? '#00CC00' : 'gray'}>
                    {text === 1 ? '待支付' : text === 2 ? '待发货' : text === 3 ? '已发货' : text === 4 ? '已收货' : '已过期'}
                </Tag>
        }, {
            title: '订单创建时间',
            dataIndex: 'created_at',
            align: 'center'
        }, {
            title: '订单修改时间',
            dataIndex: 'updated_at',
            align: 'center'
        }],
        orderList: [],
        loading: false,
        total: 0,
        current: 1,
        order_no: '',
        trade_no: '',
        status: null,
        order_id: null,
        isPost: false,
        express_no: '',
        express_type: ''
    }

    componentDidMount() {
        this.queryOrder()
    }

    queryOrder() {
        const {
            current,
            order_no,
            trade_no,
            status
        } = this.state
        this.setState({loading: true})
        requestWithToken({
            url: '/api/admin/orders',
            params: {
                current,
                order_no,
                trade_no,
                status,
                include: 'goods,user'
            }
        }, this.props.user.token).then(res => {
            res.data.data.forEach(item => item['key'] = item.id)
            this.setState({loading: false, total: res.data.meta.pagination.total, orderList: res.data.data})
        }).catch(() => {
            message.error('请求数据失败')
            this.setState({loading: false})
        })
    }

    pageChange = pageNumber => {
        this.setState({current: pageNumber}, this.queryOrder)
    }

    resetQuery = () => {
        this.resetQueryBtn.current.click()
        this.setState({
            order_no: '',
            trade_no: '',
            status: null
        })
    }

    postOrder = () => {
        const {order_id, express_no, express_type} = this.state
        if (order_id !== null && express_no !== '' && express_type !== '') {
            this.setState({loading: true})
            requestWithToken({
                url: `/api/admin/orders/${order_id}/post`,
                method: 'patch',
                data: {express_no, express_type}
            }, this.props.user.token).then(() => {
                message.success('发货成功')
                this.cancelPost()
                this.queryOrder()
            }).catch(err => {
                message.error(err.response.data.message)
                this.setState({loading: false})
            })
        } else message.error('请完善信息')
    }

    cancelPost = () => {
        this.resetPostBtn.current.click()
        this.setState({order_id: null, isPost: false, express_no: '', express_type: ''})
    }

    render() {
        const {columns, orderList, loading, total, current, isPost} = this.state
        return (
            <div style={{width: '100%'}}>
                <Form layout={'inline'} colon={false}
                      style={{display: 'flex', justifyContent: 'space-between', padding: '10px'}}>
                    <Form.Item label='订单号(可选)' labelCol={{offset: 1}} name='order_no'>
                        <Input allowClear placeholder={'请输入订单号'}
                               onChange={event => this.setState({order_no: event.target.value})}/>
                    </Form.Item>
                    <Form.Item label='支付流水号(可选)' name='trade_no'>
                        <Input allowClear placeholder={'请输入支付流水号'}
                               onChange={event => this.setState({trade_no: event.target.value})}/>
                    </Form.Item>
                    <Form.Item label='订单状态(可选)' name='status'>
                        <Select style={{width: '150px'}} onSelect={value => this.setState({status: value})}
                                placeholder='请选择'>
                            <Select.Option value={1}>待支付</Select.Option>
                            <Select.Option value={2}>待发货</Select.Option>
                            <Select.Option value={3}>已发货</Select.Option>
                            <Select.Option value={4}>已收货</Select.Option>
                            <Select.Option value={5}>已过期</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button style={{marginRight: '10px'}} onClick={this.resetQuery}>重置</Button>
                        <Button htmlType={'reset'} ref={this.resetQueryBtn}
                                style={{position: "absolute", top: 0}}/>
                        <Button type={'primary'}
                                onClick={() => {
                                    this.setState({current: 1}, this.queryOrder)
                                }}
                                loading={loading}>查询</Button>
                    </Form.Item>
                </Form>

                <Table columns={columns} dataSource={orderList} loading={loading}
                       pagination={{
                           position: ['bottomCenter'],
                           total,
                           current,
                           showSizeChanger: false,
                           hideOnSinglePage: true,
                           showLessItems: true,
                           showQuickJumper: true,
                           onChange: this.pageChange
                       }} expandable={{
                    expandRowByClick: true,
                    expandedRowRender: record =>
                        <>
                            <div style={{display: 'flex', flexWrap: 'wrap', lineHeight: '32px'}}>
                                <div style={{margin: '10px 50px'}}>订单总价：
                                    <span style={{color: '#999999'}}>￥{record.amount}</span>
                                </div>
                                {
                                    record.pay_type ?
                                        <div style={{margin: '10px 50px'}}>支付类型：
                                            <span style={{color: '#999999'}}>{record.pay_type}</span>
                                        </div> : record.pay_type
                                }{
                                record.pay_time ?
                                    <div style={{margin: '10px 50px'}}>支付时间：
                                        <span style={{color: '#999999'}}>{record.pay_time}</span>
                                    </div> : record.pay_time
                            }{
                                record.express_type ?
                                    <div style={{margin: '10px 50px'}}>快递类型：
                                        <span
                                            style={{color: '#999999'}}>{record.express_type === 'SF' ? '顺丰快递' : record.express_type === 'YD' ? '韵达快递' : '圆通快递'}
                                        </span>
                                    </div> : record.express_type
                            }{
                                record.express_no ?
                                    <div style={{margin: '10px 50px'}}>快递单号：
                                        <span style={{color: '#999999'}}>{record.express_no}</span>
                                    </div> : record.express_no
                            }{
                                record.status === 2 ?
                                    <Button type='primary' style={{margin: '10px 50px'}}
                                            onClick={() => this.setState({
                                                order_id: record.id,
                                                isPost: true
                                            })}>发货</Button> : null
                            }
                            </div>
                            <Divider/>
                            <div style={{display: 'flex', flexWrap: 'wrap'}}>
                                <img src={record.user.avatar_url} alt="avatar"
                                     style={{width: '50px', height: '50px', borderRadius: '50%', marginLeft: '50px'}}/>
                                <div style={{margin: '10px 50px'}}>买家昵称：
                                    <span style={{color: '#999999'}}>{record.user.name}</span>
                                </div>
                                <div style={{margin: '10px 50px'}}>买家邮箱：
                                    <span style={{color: '#999999'}}>{record.user.email}</span>
                                </div>
                                <div style={{margin: '10px 50px'}}>买家手机：
                                    <span
                                        style={{color: '#999999'}}>{record.user.phone === null ? '无' : record.user.phone}
                                    </span>
                                </div>
                                <div style={{margin: '10px 50px'}}>买家是否锁定：
                                    <span style={{color: '#999999'}}>{record.user.is_locked === 0 ? '正常' : '锁定'}</span>
                                </div>
                            </div>
                            <Divider/>
                            <div>{
                                record.goods.data.map(item => {
                                    return <div key={item.id} style={{display: 'flex', flexWrap: 'wrap'}}>
                                        <img src={item.cover_url} alt="cover"
                                             style={{
                                                 width: '50px',
                                                 height: '50px',
                                                 borderRadius: '50%',
                                                 marginLeft: '50px'
                                             }}/>
                                        <div style={{margin: '10px 50px'}}>商品名称：
                                            <span style={{color: '#999999'}}>{item.title}</span>
                                        </div>
                                        <div style={{margin: '10px 50px'}}>商品描述：
                                            <span style={{color: '#999999'}}>{item.description}</span>
                                        </div>
                                        <div style={{margin: '10px 50px'}}>商品价格：
                                            <span style={{color: '#999999'}}>￥{item.price}</span>
                                        </div>
                                    </div>
                                })
                            }</div>
                        </>
                }}/>
                <Modal title="订单发货" visible={isPost} closable={false} footer={null}
                       style={{textAlign: 'center'}}>
                    <Form style={{textAlign: 'initial'}} size='large'>
                        <Form.Item label='快递公司' name='express_type' required hasFeedback rules={[{required: true}]}>
                            <Select placeholder='请选择' allowClear
                                    onSelect={value => this.setState({express_type: value})}>
                                <Select.Option value='SF'>顺丰快递</Select.Option>
                                <Select.Option value='YTO'>圆通快递</Select.Option>
                                <Select.Option value='YD'>韵达快递</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label='快递单号' name='express_no' required hasFeedback rules={[{required: true}]}>
                            <Input placeholder='请输入快递单号' allowClear
                                   onChange={event => this.setState({express_no: event.target.value})}/>
                        </Form.Item>
                        <Form.Item>
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Button style={{marginRight: '10px'}} onClick={this.cancelPost}>取消</Button>
                                <Button htmlType={'reset'} ref={this.resetPostBtn}
                                        style={{position: "absolute", top: 0}}/>
                                <Button type={'primary'} onClick={this.postOrder} loading={loading}>发货</Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        )
    }
}

export default connect(state => (
        {
            user: state.user
        }
    ),
    {}
)(Order)