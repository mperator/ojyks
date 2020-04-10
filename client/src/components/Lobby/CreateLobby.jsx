import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'

import { UserContext } from '../../context/user-context'

export default class CreateLobby extends Component {
    static contextType = UserContext

    constructor(props) {
        super(props);

        this.state = {
            roomname: "",
            errorMessage: ""
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleClick(e) {
        e.preventDefault();
        this.context.send({ user: this.context.username, lobby: this.state.roomname, action: 'create-lobby' });
    }

    handleMessage(data) {
        if (data.type !== 'response' ||
            data.action !== 'create-lobby') return;

        if (data.state === 'success') {
            this.props.history.push(`/lobby/${data.lobby}`);
        } else {
            this.setState({ errorMessage: data.errorMessage });
        }
    }

    componentDidMount() {
        this.context.registerCallback('createLobbyMessageHandler', this.handleMessage);
    }

    componentWillUnmount() {
        this.context.unregisterCallback('createLobbyMessageHandler');
    }

    render() {
        return (
            <div>
                <h1>Willkommen, {this.context.username}</h1>
                <p>Bitte vergieb einen Namen für deine Lobby. Andere Spieler können in die Lobby beitreten wenn diese erstellt wurde.</p>

                <div>
                    <label htmlFor="roomname">Lobby:</label>
                    <input type="text" name="roomname" id="roomname" value={this.state.roomname} onChange={this.handleChange} />
                    {this.state.errorMessage && <span className="error">{this.state.errorMessage}</span>}
                </div>

                <button onClick={this.handleClick}>
                    {/* <NavLink to="/lobby">create</NavLink> */}
                </button>
            </div>
        )
    }
}
