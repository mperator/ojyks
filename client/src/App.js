import React, { Component } from 'react';
import './App.css';

import { BrowserRouter, Route, Switch } from 'react-router-dom'

import Login from './components/Login/Login'
import Lobby from './components/Lobby/Lobby'
import JoinLobby from './components/Lobby/JoinLobby'
import CreateLobby from './components/Lobby/CreateLobby'
import Ojyks from './components/Ojyks'

import { UserContext } from './context/user-context'

import { v4 as uuid } from 'uuid'

export default class App extends Component {
    constructor(props) {
        super(props);

        this.setUsername = (username) => {
            console.log(username)

            localStorage.setItem('ojyks-user', username);

            if(!localStorage.getItem('ojyks-uuid'))
                localStorage.setItem('ojyks-uuid', uuid());

            this.setState({
                username: username,
                uuid: localStorage.getItem('ojyks-uuid')
            });
        }

        this.registerCallback = (name, callback) => {
            const callbacks = this.state.callbacks;
            callbacks[name] = callback;

            this.setState({ callbacks: callbacks });
        }

        this.unregisterCallback = (name) => {
            const callbacks = this.state.callbacks;
            delete callbacks[name];

            this.setState({ callbacks: callbacks });
        }

        this.send = (data) => {
            this.state.ws.send(JSON.stringify(data));
        }

        this.addMessage = (msg) => {
            this.setState(state => ({ chat: [msg, ...state.chat] }));
        }

        this.state = {
            username: localStorage.getItem('ojyks-user'),
            uuid: localStorage.getItem('ojyks-uuid'),
            setUsername: this.setUsername,
            registerCallback: this.registerCallback,
            unregisterCallback: this.unregisterCallback,
            send: this.send,
            callbacks: {},
            chat: [],
            ws: new WebSocket('ws://localhost:3001'),
            addMessage: this.addMessage
        }

        // this.ws = new WebSocket('wss://ojyks-server.azurewebsites.net');
        // this.ws = new WebSocket('ws://localhost:3001');
    }

    componentDidMount() {
        console.log("mounted")

        //const ws = new WebSocket('ws://localhost:3001');
        const ws = this.state.ws;
        ws.onopen = () => {
            console.log('connected');
        }
        ws.onmessage = event => {
            var callbacks = this.state.callbacks;

            // distribute message to all registered callback functions.
            for (const name in callbacks) {
                callbacks[name](JSON.parse(event.data))
            }
        }

        // this.setState({ ws: ws });

        // const username = localStorage.getItem('ojyks-user');
        // const uuid = localStorage.getItem('ojyks-uuid');
        // this.setState({ username: username, uuid: uuid });
    }

    render() {
        return (
            <div className="App" >
                <UserContext.Provider value={this.state}>
                    <BrowserRouter>
                        <Switch>
                            <Route exact path="/" component={Login} />
                            <Route exact path="/login" component={Login} />
                            <Route exact path="/lobby/create" component={CreateLobby} />
                            <Route exact path="/lobby/join" component={JoinLobby} />
                            <Route exact path="/lobby/:name" component={Lobby} />
                            <Route path="/game/:name" component={Ojyks} />
                        </Switch>
                    </BrowserRouter>
                </UserContext.Provider>
            </div>
        );
    }
}
