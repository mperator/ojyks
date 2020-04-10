import React from 'react';
import './App.css';

import { BrowserRouter, Route } from 'react-router-dom'

import Ojyks from './components/Ojyks'

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Route exact path="/" />
        <Route path="/game:id" component={Ojyks} />
      </BrowserRouter>
    </div>
  );
}

export default App;
