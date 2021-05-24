import React, {Component} from 'react';
import {Skeleton} from 'antd'

export default class Timer extends Component {
    state = {date: '', time: ''}

    componentDidMount() {
        const id = setInterval(() => {
            const date = new Date()
            let time = date.toISOString().split('T')[1].split('.')[0]
            let hour = Number.parseInt(time.split(':')[0]) + 8
            time = hour + ':' + time.split(':')[1] + ':' + time.split(':')[2]
            this.setState({
                date: date.toISOString().split('T')[0],
                time
            })
        }, 1000)
        this.setState({id})
    }

    componentWillUnmount() {
        window.clearInterval(this.state.id)
    }

    render() {
        const style = {
            ...this.props.style,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }
        const {date, time} = this.state
        return (
            <div style={style}>
                <Skeleton loading={this.state.date === ''} active paragraph={{width: ['100%', '100%'], rows: 2}}
                          title={false}>
                    <div style={{
                        fontWeight: 'bold',
                        fontSize: '60px',
                        animation: 'antMoveUpIn 0.3s',
                        color: 'gray'
                    }}>{date + ' ' + time}</div>
                </Skeleton>
            </div>
        )
    }
}