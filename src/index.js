import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {HashRouter} from "react-router-dom";
import store, {persistor} from "./redux/store";
import {Provider} from "react-redux";
import {PersistGate} from "redux-persist/integration/react";
import {ConfigProvider} from "antd";
import moment from 'moment'
import 'moment/locale/zh-cn'
import zh_CN from 'antd/lib/locale-provider/zh_CN'

moment.locale('zh-cn')

ReactDOM.render(
    <HashRouter>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <ConfigProvider locale={zh_CN}>
                    <App/>
                </ConfigProvider>
            </PersistGate>
        </Provider>
    </HashRouter>,
    document.getElementById('root')
)
