import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'

import { UserContext } from '../../context/user-context'

export default class CreateLobby extends Component {
    static contextType = UserContext

    constructor(props) {
        super(props);

        this.state = {
            roomname: ""
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleClick(e) {
        e.preventDefault();

    }

    render() {
        return (
            <div>
                <h1>Willkommen, {this.context.username}</h1>
                <p>Bitte vergieb einen Namen für deine Lobby. Andere Spieler können in die Lobby beitreten wenn diese erstellt wurde.</p>

                <div>
                    <label htmlFor="roomname">Lobby:</label>
                    <input type="text" name="roomname" id="roomname" value={this.state.roomname} onChange={this.handleChange} />
                </div>

                <button onClick={this.handleClick}>
                    <NavLink to="/lobby">create</NavLink>
                </button>
            </div>
        )
    }
}
