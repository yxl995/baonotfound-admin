import React, {Component} from "react"
import './App.css'
import {Route} from 'react-router-dom'
import Index from "./pages/Index/Index";
import Login from "./pages/Login/Login";

export default class App extends Component {

    render() {
        return (
            <>
                <Route path='/' exact component={Login}/>
                <Route path='/index' component={Index}/>
            </>
        )
    }
}