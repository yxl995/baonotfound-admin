import React, {Component} from 'react';
import {requestWithToken} from "../../network/request";
import {connect} from "react-redux";
import {message, Table, Tag, Rate, Form, Input, Button, Select, Divider, Modal} from "antd";
import {SmileFilled, MehFilled, FrownFilled} from '@ant-design/icons'

class Comment extends Component {

    resetQueryBtn = React.createRef()
    resetReplyBtn = React.createRef()

    state = {
        columns: [{
            title: '买家头像',
            dataIndex: ['user', 'avatar_url'],
            align: 'center',
            render: text => <img src={text} alt="avatar_url"
                                 style={{width: '50px', height: '50px', borderRadius: '50%'}}/>
        }, {
            title: '买家昵称',
            dataIndex: ['user', 'name'],
            align: 'center'
        }, {
            title: '商品图片',
            dataIndex: ['goods', 'cover_url'],
            align: 'center',
            render: text => <img src={text} alt="cover_url"
                                 style={{width: '50px', height: '50px', borderRadius: '5px'}}/>
        }, {
            title: '商品名称',
            dataIndex: ['goods', 'title'],
            align: 'center'
        }, {
            title: '评论级别',
            dataIndex: 'rate',
            align: 'center',
            render: text => <Tag icon={text === 1 ? <SmileFilled/> : text === 2 ? <MehFilled/> : <FrownFilled/>}
                                 color={text === 1 ? '#FF3300' : text === 2 ? '#FFCC00' : 'gray'}>{text === 1 ? '好评' : text === 2 ? '中评' : '差评'}</Tag>
        }, {
            title: '评论星级',
            dataIndex: 'star',
            align: 'center',
            render: text => <Rate disabled value={text}/>
        }, {
            title: '评论创建时间',
            dataIndex: 'created_at',
            align: 'center'
        }, {
            title: '评论更新时间',
            dataIndex: 'updated_at',
            align: 'center'
        }],
        commentList: [],
        loading: false,
        total: 0,
        current: 1,
        goods_title: '',
        rate: null,
        isReply: false,
        comment_id: null,
        reply: ''
    }

    componentDidMount() {
        this.queryComment()
    }

    queryComment = () => {
        const {current, goods_title, rate} = this.state
        this.setState({loading: true})
        requestWithToken({
            url: '/api/admin/comments',
            params: {current, goods_title, rate}
        }, this.props.user.token).then(res => {
            let promiseArray = []
            res.data.data.forEach(item => {
                item['key'] = item.id
                let promise = new Promise(resolve => {
                    let array = []
                    let p1 = new Promise(resolve1 => {
                        requestWithToken({
                            url: `/api/admin/goods/${item.goods_id}`
                        }, this.props.user.token).then(result => {
                            item['goods'] = result.data
                            resolve1()
                        })
                    })
                    let p2 = new Promise(resolve2 => {
                        requestWithToken({
                            url: `/api/admin/users/${item.user_id}`
                        }, this.props.user.token).then(result => {
                            item['user'] = result.data
                            resolve2()
                        })
                    })
                    array.push(p1)
                    array.push(p2)
                    Promise.all(array).then(resolve)
                })
                promiseArray.push(promise)
            })
            Promise.all(promiseArray).then(() => this.setState({
                loading: false,
                total: res.data.meta.pagination.total,
                commentList: res.data.data
            }))
        }).catch(err => {
            message.error(err.response.data.message)
            this.setState({loading: false})
        })
    }

    pageChange = pageNumber => {
        this.setState({current: pageNumber}, this.queryComment)
    }

    resetQuery = () => {
        this.resetQueryBtn.current.click()
        this.setState({goods_title: '', rate: null})
    }

    cancelReply = () => {
        this.resetReplyBtn.current.click()
        this.setState({
            comment_id: null,
            isReply: false,
            reply: ''
        })
    }

    replyComment = () => {
        const {reply, comment_id} = this.state
        if (reply === '') message.error('回复内容不能为空')
        else {
            this.setState({loading: true})
            requestWithToken({
                url: `/api/admin/comments/${comment_id}/reply`,
                method: 'patch',
                data: {reply}
            }, this.props.user.token).then(() => {
                message.success('回复成功')
                this.cancelReply()
                this.queryComment()
            }).catch(err => {
                message.error(err.response.data.message)
                this.setState({loading: false})
            })
        }
    }

    render() {
        const {columns, commentList, loading, total, current, isReply} = this.state
        return (
            <div style={{width: '100%'}}>
                <Form layout={'inline'} colon={false}
                      style={{padding: '10px', display: 'flex', justifyContent: 'space-between'}}>
                    <Form.Item label={'商品名称(可选)'} name='title' labelCol={{offset: 1}}>
                        <Input allowClear placeholder='请输入商品名称'
                               onChange={event => this.setState({goods_title: event.target.value})}/>
                    </Form.Item>
                    <Form.Item label={'评论级别(可选)'} name='rate'>
                        <Select placeholder='请选择' style={{width: '150px'}}
                                onChange={value => this.setState({rate: value})}>
                            <Select.Option value={1}>好评</Select.Option>
                            <Select.Option value={2}>中评</Select.Option>
                            <Select.Option value={3}>差评</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button style={{marginRight: '10px'}} onClick={this.resetQuery}>重置</Button>
                        <Button htmlType={'reset'} ref={this.resetQueryBtn}
                                style={{position: "absolute", top: 0}}/>
                        <Button type={'primary'}
                                onClick={() => {
                                    this.setState({current: 1}, this.queryComment)
                                }}
                                loading={loading}>查询</Button>
                    </Form.Item>
                </Form>
                <Table columns={columns} dataSource={commentList} loading={loading}
                       pagination={{
                           position: ['bottomCenter'],
                           total,
                           current,
                           showSizeChanger: false,
                           hideOnSinglePage: true,
                           showLessItems: true,
                           showQuickJumper: true,
                           onChange: this.pageChange
                       }}
                       expandable={{
                           expandRowByClick: true,
                           expandedRowRender: record => <>
                               <div>
                                   <div style={{margin: '10px 50px'}}>评论内容：
                                       <span style={{color: '#999999'}}>{record.content}</span>
                                   </div>
                                   <div style={{margin: '10px 50px', lineHeight: '32px'}}>回复：
                                       {
                                           record.reply === null ?
                                               <>
                                                   <span style={{color: '#999999'}}>暂无</span>
                                                   <Button type='text' style={{color: 'deepskyblue'}}
                                                           onClick={() => this.setState({
                                                               isReply: true,
                                                               comment_id: record.id
                                                           })}>回复</Button>
                                               </> :
                                               <span style={{color: '#999999'}}>{record.reply}</span>
                                       }
                                   </div>
                               </div>
                               <Divider/>
                               <div style={{display: 'flex', flexWrap: 'wrap'}}>
                                   <div style={{margin: '10px 50px'}}>商品描述：
                                       <span style={{color: '#999999'}}>{record.goods.description}</span>
                                   </div>
                                   <div style={{margin: '10px 50px'}}>商品是否上架：
                                       <span
                                           style={{color: '#999999'}}>{record.goods.is_on === 1 ? '已上架' : '未上架'}
                                       </span>
                                   </div>
                                   <div style={{margin: '10px 50px'}}>商品是否推荐：
                                       <span
                                           style={{color: '#999999'}}>{record.goods.is_recommend === 1 ? '已推荐' : '未推荐'}
                                       </span>
                                   </div>
                                   <div style={{margin: '10px 50px'}}>商品价格：
                                       <span style={{color: '#999999'}}>￥{record.goods.price}</span>
                                   </div>
                                   <div style={{margin: '10px 50px'}}>商品销量：
                                       <span style={{color: '#999999'}}>{record.goods.sales}</span>
                                   </div>
                                   <div style={{margin: '10px 50px'}}>商品库存：
                                       <span style={{color: '#999999'}}>{record.goods.stock}</span>
                                   </div>
                                   <div style={{margin: '10px 50px'}}>商品创建时间：
                                       <span style={{color: '#999999'}}>{record.goods.created_at}</span>
                                   </div>
                                   <div style={{margin: '10px 50px'}}>商品更新时间：
                                       <span style={{color: '#999999'}}>{record.goods.updated_at}</span>
                                   </div>
                               </div>
                               <Divider/>
                               <div style={{display: 'flex', flexWrap: 'wrap'}}>
                                   <div style={{margin: '10px 100px 10px 50px'}}>买家邮箱：
                                       <span style={{color: '#999999'}}>{record.user.email}</span>
                                   </div>
                                   <div style={{margin: '10px 100px'}}>买家手机：
                                       <span style={{color: '#999999'}}>{record.user.phone}</span>
                                   </div>
                                   <div style={{margin: '10px 150px 10px 100px'}}>买家是否锁定：
                                       <span
                                           style={{color: '#999999'}}>{record.user.is_locked === 0 ? '正常' : '锁定'}
                                       </span>
                                   </div>
                                   <div style={{margin: '10px 100px 10px 50px'}}>买家创建时间：
                                       <span style={{color: '#999999'}}>{record.user.created_at}</span>
                                   </div>
                                   <div style={{margin: '10px 100px'}}>买家更新时间：
                                       <span style={{color: '#999999'}}>{record.user.updated_at}</span>
                                   </div>
                               </div>
                           </>
                       }}/>
                <Modal title="回复评论" visible={isReply} closable={false} footer={null}
                       style={{textAlign: 'center'}}>
                    <Form style={{textAlign: 'initial'}} size='large'>
                        <Form.Item label='回复内容' name='reply' required hasFeedback rules={[{required: true}]}>
                            <Input.TextArea placeholder='请输入回复内容' allowClear maxLength={100} showCount
                                            onChange={event => this.setState({reply: event.target.value})}/>
                        </Form.Item>
                        <Form.Item>
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Button style={{marginRight: '10px'}} onClick={this.cancelReply}>取消</Button>
                                <Button htmlType={'reset'} ref={this.resetReplyBtn}
                                        style={{position: "absolute", top: 0}}/>
                                <Button type={'primary'} onClick={this.replyComment} loading={loading}>回复</Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        )
    }
}

export default connect(
    state => ({user: state.user}),
    {}
)(Comment)