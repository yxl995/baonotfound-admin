import React, {Component} from 'react';
import {Button, Table, message, Modal, Form, Input, TreeSelect, Popconfirm} from 'antd'
import {connect} from "react-redux";
import {PlusCircleOutlined} from "@ant-design/icons";
import {requestWithToken} from "../../network/request";

class Category extends Component {

    resetBtn = React.createRef()

    state = {
        columns: [{
            title: '分类名称',
            dataIndex: 'name'
        }, {
            title: '操作',
            dataIndex: 'action',
            align: 'center'
        }],
        categoryList: [],
        loading: false,
        name: '',
        isShow: false,
        pid: 0,
        type: '',
        id: null
    }

    componentDidMount() {
        this.queryCategory()
    }

    queryCategory = () => {
        this.setState({loading: true})
        requestWithToken({
            url: '/api/admin/category',
            params: {type: 'all'}
        }, this.props.user.token).then(res => {
            let categoryList = [...res.data]
            categoryList.forEach(item => {
                this.addKey(item, 0)
            })
            this.setState({categoryList, loading: false})
        }).catch(() => {
            message.error('请求失败')
            this.setState({loading: false})
        })
    }

    addKey = (parent, status) => {
        if (Object.hasOwnProperty.call(parent, 'children')) {
            if (parent.children.length === 0) delete parent['children']
            else parent.children.forEach(child => {
                this.addKey(child, parent.status)
            })
        }
        parent['disabled'] = parent.status === 1
        parent['value'] = parent.id
        parent['title'] = parent.name
        parent['key'] = parent.id
        parent['action'] =
            <>
                <Button type='text' disabled={parent.status === 1} onClick={event => {
                    event.stopPropagation();
                    this.setState({isShow: true, type: 'update', id: parent.id})
                }}>编辑</Button>
                <Popconfirm title="确定要进行操作吗?"
                            onConfirm={event => this.lockOrUnlock(event, parent.id, parent.status, parent.children)}
                            onCancel={event => event.stopPropagation()}>
                    <Button type='text' style={{color: parent.status === 1 ? 'deepskyblue' : 'red'}}
                            onClick={event => event.stopPropagation()} disabled={status === 1}>
                        {parent.status === 1 ? '启用' : '禁用'}
                    </Button>
                </Popconfirm>
            </>
    }

    lockOrUnlock = (event, id, status, children) => {
        event.stopPropagation()
        let promiseArray = []
        let parent = new Promise((resolve, reject) => requestWithToken({
            url: `/api/admin/category/${id}/status`,
            method: 'patch'
        }, this.props.user.token).then(resolve).catch(reject))
        promiseArray.push(parent)
        if (children)
            children.forEach(item => {
                if (item.status === status) {
                    let child = new Promise((resolve, reject) => requestWithToken({
                        url: `/api/admin/category/${item.id}/status`,
                        method: 'patch'
                    }, this.props.user.token).then(resolve).catch(reject))
                    promiseArray.push(child)
                }
            })
        Promise.all(promiseArray).then(() => {
            message.success('操作成功')
            this.queryCategory()
        }).catch(() => {
            message.error('操作失败')
            this.queryCategory()
        })
    }

    nameChange = event => {
        this.setState({name: event.target.value})
    }

    updateCategory = type => {
        const {name, id, pid} = this.state
        if (name === '') message.error('请输入分类名称')
        else {
            this.setState({loading: true})
            requestWithToken({
                url: type === 'update' ? `/api/admin/category/${id}` : '/api/admin/category',
                method: type === 'update' ? 'put' : 'post',
                data: {name, pid}
            }, this.props.user.token).then(() => {
                message.success(type === 'update' ? '更新成功' : '添加成功')
                this.cancel()
                this.queryCategory()
            }).catch(err => {
                if (err.response.status === 400) message.error('不能超过二级分类')
                else message.error(type === 'update' ? '更新失败' : '添加失败')
                this.setState({loading: false})
            })
        }
    }

    cancel = () => {
        this.resetBtn.current.click()
        this.setState({name: '', isShow: false, type: '', id: null, pid: 0})
    }

    changeTree = value => {
        this.setState({pid: value})
    }

    render() {
        const {categoryList, columns, loading, isShow, type} = this.state
        return (
            <div style={{width: '100%'}}>
                <Button type={'primary'} icon={<PlusCircleOutlined/>} size={'large'} style={{margin: '10px'}}
                        onClick={() => this.setState({isShow: true, type: 'add'})}>添加分类</Button>
                <Table columns={columns} dataSource={categoryList} loading={loading} pagination={false}
                       expandable={{expandRowByClick: true, indentSize: 30}}/>
                <Modal title={type === 'update' ? "更新分类" : '添加分类'} visible={isShow}
                       closable={false} footer={null} style={{textAlign: 'center'}}>
                    <Form size={'large'} style={{textAlign: 'initial'}}>
                        <Form.Item label='父级' name='parent'>
                            <TreeSelect treeData={categoryList} placeholder="请选择父级(不选则为顶级)"
                                        onChange={this.changeTree}/>
                        </Form.Item>
                        <Form.Item label='名称' name='name' rules={[{required: true}]} hasFeedback>
                            <Input allowClear placeholder={'请输入分类名称'} onChange={this.nameChange}/>
                        </Form.Item>
                        <Form.Item>
                            <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                                <Button htmlType={'reset'} ref={this.resetBtn}
                                        style={{position: 'absolute', top: 0}}/>
                                <Button style={{marginRight: '10px', width: '20%'}}
                                        onClick={this.cancel}>取消</Button>
                                <Button style={{width: '20%'}} onClick={() => this.updateCategory(type)}
                                        type={'primary'} loading={loading}>{type === 'update' ? '更新' : '添加'}</Button>
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
)(Category)