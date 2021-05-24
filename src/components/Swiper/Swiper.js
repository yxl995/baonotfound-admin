import React, {Component} from 'react';
import {connect} from "react-redux";
import {Button, message, Switch, Table, Popconfirm, Typography, Upload, Modal, Form, Input} from "antd";
import {requestWithToken} from "../../network/request";
import './Swiper.css'
import {PlusCircleOutlined} from "@ant-design/icons";

class Swiper extends Component {

    resetAddBtn = React.createRef()

    getExtraData = file => {
        const {OSSData} = this.state
        return {
            key: file.url,
            OSSAccessKeyId: OSSData.accessid,
            policy: OSSData.policy,
            Signature: OSSData.signature,
        }
    }

    beforeUpload = async file => {
        const {OSSData} = this.state;
        const expire = OSSData.expire * 1000;
        if (expire < Date.now()) await this.requestOSSToken()
        const suffix = file.name.slice(file.name.lastIndexOf('.'));
        const filename = Date.now() + suffix;
        file.url = 'ad/' + filename;
        return file;
    }

    onChange = async (result, record) => {
        if (result.file.status === 'done') {
            record.img = result.file.url
            await this.updateSwiper(record)
            setTimeout(this.querySwiper, 100)
        }
    }

    state = {
        columns: [{
            title: '轮播序号',
            dataIndex: 'seq',
            align: 'center',
            sorter: (a, b) => a.seq - b.seq,
            sortOrder: ['descend'],
            sortDirections: ['descend'],
            showSorterTooltip: false,
            width: 120,
            render: (text, record) => <Typography.Text style={{width: '80px', margin: 'auto'}} editable={{
                onChange: event => {
                    if (event !== text.toString() && event !== '') {
                        this.updateSeq(event, record.id)
                    } else if (event === '') message.error('顺序不能为空')
                }
            }}>{text.toString()}</Typography.Text>
        }, {
            title: '轮播图',
            dataIndex: 'img_url',
            align: 'center',
            render: (text, record) =>
                <Upload accept='.jpg,.png' showUploadList={false}
                        action={this.state.OSSData ? this.state.OSSData.host : ''}
                        data={this.getExtraData} beforeUpload={this.beforeUpload}
                        onChange={result => this.onChange(result, record)}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <img src={text} alt='img_url' style={{width: '100%', height: '100%'}}/>
                        <a className='swiper_shadow'>更换</a>
                    </div>
                </Upload>
        }, {
            title: '轮播名称',
            dataIndex: 'title',
            align: 'center',
            width: 200,
            render: (text, record) => <Typography.Text style={{width: '150px', margin: 'auto'}} editable={{
                onChange: event => {
                    if (event !== text && event !== '') {
                        record.title = event;
                        this.updateSwiper(record)
                    } else if (event === '') message.error('名称不能为空')
                }
            }}>{text}</Typography.Text>
        }, {
            title: '轮播链接',
            dataIndex: 'url',
            align: 'center',
            width: 250,
            render: (text, record) => <Typography.Text style={{width: '200px', margin: 'auto'}} editable={{
                onChange: event => {
                    if (event !== text && event !== '') {
                        record.url = event;
                        this.updateSwiper(record)
                    } else if (event === '') message.error('链接不能为空')
                }
            }}>{text ? text : ''}</Typography.Text>
        }, {
            title: '轮播状态',
            dataIndex: 'status',
            align: 'center',
            render: (text, record) => <Switch checked={text === 1} checkedChildren='正常' unCheckedChildren='禁用'
                                              onChange={checked => this.lockOrUnlock(checked, record.id)}/>
        }, {
            title: '轮播添加时间',
            dataIndex: 'created_at',
            align: 'center'
        }, {
            title: '轮播更新时间',
            dataIndex: 'updated_at',
            align: 'center'
        }, {
            title: '操作',
            dataIndex: 'id',
            align: 'center',
            render: text => <Popconfirm title='确定要删除吗？' onConfirm={() => this.deleteSwiper(text)}>
                <Button type='text' style={{color: 'red'}}>删除</Button>
            </Popconfirm>
        }],
        swiperList: [],
        loading: false,
        total: 0,
        current: 1,
        OSSData: null,
        isAdd: false,
        title: '',
        img: '',
        url: '',
        status: 0
    }

    componentDidMount() {
        this.querySwiper()
        this.requestOSSToken()
    }

    requestOSSToken = () => {
        requestWithToken({
            url: '/api/auth/oss/token'
        }, this.props.user.token).then(res => {
            this.setState({OSSData: res.data})
        }).catch(() => message.error('请求数据失败'))
    }

    updateSeq = (seq, id) => {
        seq = Number.parseInt(seq)
        this.setState({loading: true})
        requestWithToken({
            url: `/api/admin/slides/${id}/seq`,
            method: 'patch',
            data: {seq}
        }, this.props.user.token).then(() => {
            message.success('修改成功')
            this.querySwiper()
        }).catch(err => {
            message.error(err.response.data.message)
            this.querySwiper()
        })
    }

    querySwiper = () => {
        this.setState({loading: true})
        requestWithToken({
            url: '/api/admin/slides',
            params: {current: this.state.current}
        }, this.props.user.token).then(res => {
            res.data.data.forEach(item => item['key'] = item.id)
            this.setState({swiperList: res.data.data, total: res.data.meta.pagination.total, loading: false})
        }).catch(() => {
            message.error('请求数据失败')
            this.setState({loading: false})
        })
    }

    updateSwiper = item => {
        const {title, img, url, id} = item
        this.setState({loading: true})
        requestWithToken({
            url: `/api/admin/slides/${id}`,
            method: 'put',
            data: {title, img, url}
        }, this.props.user.token).then(() => {
            message.success('修改成功')
            this.querySwiper()
        }).catch(err => {
            message.error(err.response.data.message)
            this.querySwiper()
        })
    }

    lockOrUnlock = (checked, id) => {
        this.setState({loading: true})
        requestWithToken({
            url: `/api/admin/slides/${id}/status`,
            method: 'patch'
        }, this.props.user.token).then(() => {
            message.success('操作成功')
            this.querySwiper()
        }).catch(() => {
            message.error('操作失败')
            this.querySwiper()
        })
    }

    deleteSwiper = id => {
        this.setState({loading: true})
        requestWithToken({
            url: `/api/admin/slides/${id}`,
            method: 'delete'
        }, this.props.user.token).then(() => {
            message.success('删除成功')
            this.querySwiper()
        }).catch(() => {
            message.error('删除失败')
            this.setState({loading: false})
        })
    }

    pageChange = pageNumber => {
        this.setState({current: pageNumber}, this.querySwiper)
    }

    cancelAdd = () => {
        this.resetAddBtn.current.click()
        this.setState({isAdd: false, title: '', img: '', url: '', status: 0})
    }

    addSwiper = () => {
        const {title, img, url, status} = this.state
        if (title !== '' && img !== '') {
            this.setState({loading: true})
            requestWithToken({
                url: '/api/admin/slides',
                method: 'post',
                data: {title, img, url, status}
            }, this.props.user.token).then(() => {
                message.success('添加成功')
                this.cancelAdd()
                this.querySwiper()
            }).catch(err => {
                message.error(err.response.data.message)
                this.setState({loading: false})
            })
        } else
            message.error('请完善信息')
    }

    render() {
        const {columns, swiperList, loading, total, current, isAdd, OSSData, img, status} = this.state
        return (
            <div style={{width: "100%"}}>
                <Button type='primary' icon={<PlusCircleOutlined/>} size={'large'} style={{margin: '10px'}}
                        onClick={() => this.setState({isAdd: true})}>添加轮播</Button>
                <Table columns={columns} dataSource={swiperList} loading={loading}
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
                <Modal title="添加轮播" visible={isAdd} closable={false} footer={null}
                       style={{textAlign: 'center'}}>
                    <Form style={{textAlign: 'initial'}} size='large'>
                        <Form.Item label='名称' name='title' required hasFeedback rules={[{required: true}]}>
                            <Input placeholder='请输入轮播名称' allowClear
                                   onChange={event => this.setState({title: event.target.value})}/>
                        </Form.Item>
                        <Form.Item label='跳转链接' name='url'>
                            <Input placeholder='请输入跳转链接' allowClear
                                   onChange={event => this.setState({url: event.target.value})}/>
                        </Form.Item>
                        <Form.Item label='轮播状态' name='status' valuePropName='checked'>
                            <Switch defaultChecked={status === 1} checkedChildren='启用' unCheckedChildren='禁用'
                                    onChange={checked => this.setState({status: checked ? 1 : 0})}/>
                        </Form.Item>
                        <div style={{display: 'flex'}}>
                            <Form.Item label='轮播图片' required/>
                            <Upload listType="picture-card" showUploadList={false} action={OSSData ? OSSData.host : ''}
                                    data={this.getExtraData} beforeUpload={this.beforeUpload}
                                    onChange={result => {
                                        if (result.file.status === 'done') this.setState({img: result.file.url})
                                    }}>
                                {
                                    img ?
                                        <img src={OSSData.host + img} alt="avatar"
                                             style={{width: '100%'}}/> :
                                        <div><span style={{fontSize: '40px'}}>+</span><br/>上传图片</div>
                                }
                            </Upload>
                        </div>
                        <Form.Item>
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                <Button style={{marginRight: '10px'}} onClick={this.cancelAdd}>取消</Button>
                                <Button htmlType={'reset'} ref={this.resetAddBtn}
                                        style={{position: "absolute", top: 0}}/>
                                <Button type={'primary'} onClick={this.addSwiper} loading={loading}>添加</Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        )
    }
}

export default connect(state => ({user: state.user}), {})(Swiper)