import React, {Component} from 'react';
import {connect} from "react-redux";
import {
    message,
    Table,
    Switch,
    Form,
    Input,
    Button,
    TreeSelect,
    Select,
    Typography,
    InputNumber,
    Upload,
    Modal,
    Cascader
} from "antd";
import {PlusCircleOutlined} from '@ant-design/icons'
import {requestWithToken} from "../../network/request";
import './Good.css'

class Good extends Component {

    constructor(props) {
        super(props)
        props.cacheLifecycles.didRecover(this.componentDidRecover)
    }

    resetQueryBtn = React.createRef()
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
        file.url = 'react/' + filename;
        return file;
    }

    onChange = async (result, record) => {
        if (result.file.status === 'done') {
            record.cover = result.file.url
            await this.updateGoods(record)
            setTimeout(this.queryGood, 100)
        }
    }

    state = {
        columns: [{
            title: '商品图片',
            dataIndex: 'cover_url',
            align: 'center',
            width: 100,
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
                        <img src={text} alt='cover_url' style={{width: '100%', height: '100%'}}/>
                        <a className='shadow'>更换</a>
                    </div>
                </Upload>
        }, {
            title: '商品名称',
            dataIndex: 'title',
            align: 'center',
            width: 300,
            render: (text, record) =>
                <Typography.Text editable={{
                    onChange: event => {
                        if (event !== text) {
                            record.title = event;
                            this.updateGoods(record)
                        }
                    }
                }} style={{
                    width: '200px',
                    margin: '0 auto'
                }}>{text}</Typography.Text>
        }, {
            title: '商品分类',
            dataIndex: 'category_id',
            align: 'center',
            render: (text, record) => <TreeSelect value={text} style={{width: '150px', textAlign: "initial"}}
                                                  treeData={this.state.categoryList} dropdownStyle={{zIndex: 99}}
                                                  onSelect={value => {
                                                      if (record.category_id !== value) {
                                                          record.category_id = value;
                                                          this.updateGoods(record)
                                                      }
                                                  }}/>
        }, {
            title: '商品价格',
            dataIndex: 'price',
            align: 'center',
            render: (text, record) =>
                <InputNumber min={0} value={text} onStep={number => {
                    record.price = number;
                    this.updateGoods(record)
                }} onPressEnter={event => {
                    let value = Number.parseInt(event.target.value)
                    if (value !== record.price) {
                        record.price = value;
                        this.updateGoods(record)
                    }
                }}/>
        }, {
            title: '商品库存',
            dataIndex: 'stock',
            align: 'center',
            render: (text, record) =>
                <InputNumber min={0} value={text} onStep={number => {
                    record.stock = number;
                    this.updateGoods(record)
                }} onPressEnter={event => {
                    let value = Number.parseInt(event.target.value)
                    if (value !== record.stock) {
                        record.stock = value;
                        this.updateGoods(record)
                    }
                }}/>
        }, {
            title: '是否上架',
            dataIndex: 'is_on',
            align: "center",
            render: (text, record) => <Switch checked={text === 1} checkedChildren='已上架' unCheckedChildren='未上架'
                                              onChange={() => this.changeSwitch(record.id, 'on')}/>
        }, {
            title: '是否推荐',
            dataIndex: 'is_recommend',
            align: "center",
            render: (text, record) => <Switch checked={text === 1} checkedChildren='已推荐' unCheckedChildren='未推荐'
                                              onChange={() => this.changeSwitch(record.id, 'recommend')}/>
        }],
        goodList: [],
        categoryList: [],
        loading: false,
        total: 0,
        current: 1,
        title: '',
        category_id: null,
        is_on: null,
        is_recommend: null,
        OSSData: null,
        isAdd: false,
        add_category_id: null,
        add_title: '',
        add_description: '',
        add_price: null,
        add_stock: null,
        add_cover: '',
        add_details: ''
    }

    componentDidMount() {
        this.queryGood()
        this.queryCategory()
        this.requestOSSToken()
    }

    componentDidRecover = () => {
        this.queryCategory()
    }

    queryCategory = () => {
        requestWithToken({
            url: '/api/admin/category',
            params: {type: 'all'}
        }, this.props.user.token).then(res => {
            let categoryList = [...res.data]
            categoryList.forEach(item => {
                this.addKey(item)
            })
            this.setState({categoryList})
        }).catch(() => message.error('请求失败'))
    }

    addKey = (parent) => {
        if (Object.hasOwnProperty.call(parent, 'children')) {
            if (parent.children.length === 0) delete parent['children']
            else parent.children.forEach(child => {
                this.addKey(child)
            })
        }
        parent['value'] = parent.id
        parent['title'] = parent.name
        parent['label'] = parent.name
    }

    requestOSSToken = () => {
        requestWithToken({
            url: '/api/auth/oss/token'
        }, this.props.user.token).then(res => {
            this.setState({OSSData: res.data})
        }).catch(() => message.error('请求数据失败'))
    }

    updateGoods = record => {
        this.setState({loading: true})
        const {
            category_id,
            title,
            description,
            price,
            stock,
            cover,
            details,
            id
        } = record
        requestWithToken({
            url: `/api/admin/goods/${id}`,
            method: 'put',
            data: {
                category_id,
                title,
                description,
                price,
                stock,
                cover,
                details
            }
        }, this.props.user.token).then(() => {
            message.success('修改成功')
            this.setState({loading: false})
        }).catch(err => {
            message.error(err.response.data.message)
            this.setState({loading: false}, this.queryGood)
        })
    }

    changeSwitch = (id, type) => {
        this.setState({loading: true})
        requestWithToken({
            url: `/api/admin/goods/${id}/` + type,
            method: 'patch'
        }, this.props.user.token).then(() => {
            message.success('操作成功')
            this.setState({loading: false}, this.queryGood)
        }).catch(() => {
            message.error('操作失败')
            this.setState({loading: false}, this.queryGood)
        })
    }

    queryGood = () => {
        const {current, title, category_id, is_on, is_recommend} = this.state
        this.setState({loading: true})
        requestWithToken({
            url: '/api/admin/goods',
            params: {current, title, category_id, is_on, is_recommend}
        }, this.props.user.token).then(res => {
            res.data.data.forEach(item => item['key'] = item.id)
            this.setState({goodList: res.data.data, total: res.data.meta.pagination.total, loading: false})
        }).catch(() => {
            message.error('请求数据失败')
            this.setState({loading: false})
        })
    }

    pageChange = pageNumber => {
        this.setState({current: pageNumber}, this.queryGood)
    }

    resetQuery = () => {
        this.resetQueryBtn.current.click()
        this.setState({title: '', category_id: null, is_on: null, is_recommend: null})
    }

    cancelAdd = () => {
        this.resetAddBtn.current.click()
        this.setState({
            add_category_id: null,
            add_title: '',
            add_description: '',
            add_price: null,
            add_stock: null,
            add_cover: '',
            add_details: '',
            isAdd: false
        })
    }

    addGood = () => {
        const {
            add_category_id,
            add_title,
            add_description,
            add_price,
            add_stock,
            add_cover,
            add_details
        } = this.state
        if (add_category_id && add_title !== '' && add_description !== '' && add_price && add_stock && add_cover !== '' && add_details !== '') {
            this.setState({loading: true})
            requestWithToken({
                url: '/api/admin/goods',
                method: 'post',
                data: {
                    category_id: add_category_id,
                    title: add_title,
                    description: add_description,
                    price: add_price,
                    stock: add_stock,
                    cover: add_cover,
                    details: add_details
                }
            }, this.props.user.token).then(() => {
                message.success('添加成功')
                this.cancelAdd()
                this.setState({loading: false}, this.queryGood)
            }).catch(err => {
                message.error(err.response.data.message)
                this.setState({loading: false})
            })
        } else message.error('请完善信息')
    }

    render() {
        const {categoryList, columns, goodList, loading, total, current, isAdd, OSSData, add_cover} = this.state
        return (
            <div style={{width: "100%"}}>
                <Form layout={'inline'} colon={false}
                      style={{padding: '10px', display: 'flex', justifyContent: 'space-between'}}>
                    <Form.Item label={'商品名称(可选)'} name='title' labelCol={{offset: 1}}>
                        <Input allowClear placeholder={'请输入商品名称'}
                               onChange={event => this.setState({title: event.target.value})}/>
                    </Form.Item>
                    <Form.Item label='商品分类(可选)' name='category'>
                        <TreeSelect treeData={categoryList} placeholder="请选择商品分类" style={{width: '140px'}}
                                    onChange={value => this.setState({category_id: value})}
                                    dropdownStyle={{zIndex: 99}}/>
                    </Form.Item>
                    <Form.Item label='是否上架(可选)' name='is_on'>
                        <Select placeholder='请选择' style={{width: '84px'}}
                                onChange={value => this.setState({is_on: value})}>
                            <Select.Option value={1}>已上架</Select.Option>
                            <Select.Option value={0}>已下架</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label='是否推荐(可选)' name='is_recommend'>
                        <Select placeholder='请选择' style={{width: '84px'}}
                                onChange={value => this.setState({is_recommend: value})}>
                            <Select.Option value={1}>已推荐</Select.Option>
                            <Select.Option value={0}>未推荐</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button style={{marginRight: '10px'}} onClick={this.resetQuery}>重置</Button>
                        <Button htmlType={'reset'} ref={this.resetQueryBtn}
                                style={{position: "absolute", top: 0}}/>
                        <Button type={'primary'}
                                onClick={() => {
                                    this.setState({current: 1}, this.queryGood)
                                }}
                                loading={loading}>查询</Button>
                    </Form.Item>
                </Form>
                <Button icon={<PlusCircleOutlined/>} style={{margin: '0 20px'}} type='primary'
                        size='large' onClick={() => this.setState({isAdd: true})}>添加商品</Button>
                <Table columns={columns} dataSource={goodList} loading={loading}
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
                           expandedRowRender: record => <>
                               <div style={{display: 'flex', margin: '10px'}}>
                                   <div style={{marginRight: '100px'}}>销量：
                                       <span style={{color: '#999999'}}>{record.sales}</span>
                                   </div>
                                   <div style={{display: 'flex'}}>描述：
                                       <Typography.Text
                                           editable={{
                                               onChange: event => {
                                                   if (event !== record.description) {
                                                       record.description = event;
                                                       this.updateGoods(record)
                                                   }
                                               }
                                           }} style={{
                                           color: '#999999',
                                           marginLeft: '10px'
                                       }}>{record.description}</Typography.Text>
                                   </div>
                               </div>
                               <div style={{display: 'flex', margin: '10px'}}>
                                   <div style={{marginRight: '100px'}}>创建时间：
                                       <span style={{color: '#999999'}}>{record.created_at}</span>
                                   </div>
                                   <div>更新时间：
                                       <span style={{color: '#999999'}}>{record.updated_at}</span>
                                   </div>
                               </div>
                           </>
                       }}/>
                <Modal title="添加商品" visible={isAdd} closable={false} footer={null}
                       style={{textAlign: 'center'}}>
                    <Form style={{textAlign: 'initial'}} size='large'>
                        <Form.Item label='商品分类' name='category' required rules={[{type: 'array', min: 1}]}
                                   hasFeedback>
                            <Cascader allowClear options={categoryList} placeholder='请选择商品分类'
                                      onChange={value => {
                                          if (value.length === 0) this.setState({add_category_id: null})
                                          else this.setState({add_category_id: value[value.length - 1]})
                                      }}/>
                        </Form.Item>
                        <Form.Item label='商品名称' name='title' required hasFeedback rules={[{required: true}]}>
                            <Input placeholder='请输入商品名称' allowClear
                                   onChange={event => this.setState({add_title: event.target.value})}/>
                        </Form.Item>
                        <Form.Item label='商品描述' name='description' required hasFeedback rules={[{required: true}]}>
                            <Input.TextArea placeholder='请输入商品描述' allowClear maxLength={50} showCount autoSize
                                            onChange={event => this.setState({add_description: event.target.value})}/>
                        </Form.Item>
                        <Form.Item label='商品详情' name='details' required hasFeedback rules={[{required: true}]}>
                            <Input.TextArea placeholder='请输入商品详情' allowClear maxLength={200} showCount autoSize
                                            onChange={event => this.setState({add_details: event.target.value})}/>
                        </Form.Item>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <Form.Item label='商品价格(￥)' name='price' required>
                                <InputNumber placeholder='请输入' min={0}
                                             onChange={value => this.setState({add_price: value})}/>
                            </Form.Item>
                            <Form.Item label='商品库存' name='stock' required>
                                <InputNumber placeholder='请输入' min={0}
                                             onChange={value => this.setState({add_stock: value})}/>
                            </Form.Item>
                        </div>
                        <div style={{display: 'flex'}}>
                            <Form.Item label='商品图片' required/>
                            <Upload listType="picture-card" showUploadList={false} action={OSSData ? OSSData.host : ''}
                                    data={this.getExtraData} beforeUpload={this.beforeUpload}
                                    onChange={result => {
                                        if (result.file.status === 'done') this.setState({add_cover: result.file.url})
                                    }}>
                                {
                                    add_cover ?
                                        <img src={OSSData.host + add_cover} alt="avatar"
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
                                <Button type={'primary'} onClick={this.addGood} loading={loading}>添加</Button>
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
)(Good)