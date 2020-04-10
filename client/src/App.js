import React, {Component} from 'react';
import './App.css';

import { BrowserRouter, Route } from 'react-router-dom'

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

    this.state = {
        username: "jürgen",
        setUsername: this.setUsername
    }
  }

  render() {
    return (
      <div className="App" >
        <UserContext.Provider value={this.state}>
          <BrowserRouter>
            <Route exact path="/" component={Login} />
            <Route exact path="/lobby" component={Lobby} />
            <Route exact path="/lobby/create" component={CreateLobby} />
            <Route exact path="/lobby/join" component={JoinLobby} />
            <Route path="/game:id" component={Ojyks} />
          </BrowserRouter>
        </UserContext.Provider>
      </div>
    );
  }
}
