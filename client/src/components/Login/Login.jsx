import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import { UserContext } from '../../context/user-context'

export default class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: ""
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    static contextType = UserContext;

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleClick(e) {
        e.preventDefault();
        this.context.setUsername(this.state.username);
    }

    render() {
        return (
            <div>
                <h1>Login</h1>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input type="text" name="username" id="username" value={this.state.username} onChange={this.handleChange} />
                </div>
                <button onClick={this.handleClick}><Link to="/lobby/create/">Lobby öffnen</Link></button>
                <button onClick={this.handleClick}><Link to="/lobby/join">Lobby beitreten</Link></button>
            </div>
        )
    }
}
