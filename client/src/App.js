import React, { Component } from 'react';
import './App.css';

import { BrowserRouter, Route, Switch } from 'react-router-dom'

import Login from './components/Login/Login'
import Lobby from './components/Lobby/Lobby'
import JoinLobby from './components/Lobby/JoinLobby'
import CreateLobby from './components/Lobby/CreateLobby'
import Ojyks from './components/Ojyks'

import { UserContext } from './context/user-context'

export default class App extends Component {
  constructor(props) {
    super(props);

    this.setUsername = (username) => {
      console.log(username)
      this.setState({ username: username });
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
      this.ws.send(JSON.stringify(data));
    }

    this.addMessage = (msg) => {
      this.setState(state => ({ chat: [msg, ...state.chat] }));
    }
    
    this.state = {
      username: '',
      setUsername: this.setUsername,
      registerCallback: this.registerCallback,
      unregisterCallback: this.unregisterCallback,
      send: this.send,
      callbacks: {},
      chat: [],
      addMessage: this.addMessage
    }

    this.ws = new WebSocket('ws://localhost:8080');
  }

  componentDidMount() {
    this.ws.onopen = () => {
      console.log('connected');
    }

    this.ws.onmessage = event => {
      var callbacks = this.state.callbacks;

      // distribute message to all registered callback functions.
      for (const name in callbacks) {
        callbacks[name](JSON.parse(event.data))
      }
    }
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
              <Route path="/game" component={Ojyks} />
            </Switch>
          </BrowserRouter>
        </UserContext.Provider>
      </div>
    );
  }
}
