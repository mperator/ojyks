import React, { Component } from 'react'
import { Link } from 'react-router-dom'

export default class Login extends Component {
    render() {
        return (
            <div>
                <h1>Login</h1>
                <div>
                    <label htmlFor="username">Username</label>
                    <input type="text" name="username" id="username" value="" />
                </div>
                <button><Link to="/lobby/create/">Lobby öffnen</Link></button>
                <button><Link to="/lobby/join/">Lobby beitreten</Link></button>
            </div>
        )
    }
}
