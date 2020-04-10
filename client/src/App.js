import React from 'react';
import './App.css';

import { BrowserRouter, Route } from 'react-router-dom'

import Login from './components/Login/Login'
import Lobby from './components/Lobby/Lobby'
import JoinLobby from './components/Lobby/JoinLobby'
import CreateLobby from './components/Lobby/CreateLobby'
import Ojyks from './components/Ojyks'


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Route exact path="/" component={Login} />
        <Route exact path="/lobby" component={Lobby} />
        <Route exact path="/lobby/create" component={CreateLobby} />
        <Route exact path="/lobby/join" component={JoinLobby} />
        <Route path="/game:id" component={Ojyks} />
      </BrowserRouter>
    </div>
  );
}

export default App;
