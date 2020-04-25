import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

import { UserContext } from '../../context/user-context'

export default class CreateLobby extends Component {
    static contextType = UserContext

    constructor(props) {
        super(props);

        this.state = {
            lobby: "",
            errorMessage: ""
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value,
            errorMessage: ""
        });
    }

    handleClick(e) {
        e.preventDefault();

        if (this.state.lobby) {
            this.context.send({
                type: 'request',
                action: 'lobby-create',
                payload: {
                    lobby: this.state.lobby,
                    player: {
                        name: this.context.username,
                        uuid: this.context.uuid
                    }
                }
            });
        } else {
            this.setState({ errorMessage: "Fehler: Kein Lobby-Name angegeben..." })
        }
    }

    handleMessage(data) {
        const { type, action, state, payload, errorMessage } = data;
        if (type !== 'response' || action !== 'lobby-create') return;

        if (state === 'success') {
            this.props.history.push(`/lobby/${payload.lobby.name}`);
        } else {
            this.setState({ errorMessage: "Fehler: " + errorMessage });
        }
    }

    componentDidMount() {
        this.context.registerCallback('createLobbyMessageHandler', this.handleMessage);
    }

    componentWillUnmount() {
        this.context.unregisterCallback('createLobbyMessageHandler');
    }

    render() {
        // TODO router guard
        if (!this.context.username) return (<Redirect to="/" />);

        return (
            <div className="container">
                <div className="row">
                    <div className="col s12">
                        <h1>Lobby erstellen</h1>
                        <p className="flow-text">
                            Bitte leg einen Namen für deine Lobby fest. Die Lobby ist nach dem
                            Anlegen für andere Spieler sichtbar, damit diese beitreten können.
                            Es kann nur eine Lobby mit dem selben Namen gleichzeitig existieren.
                        </p>
                    </div>

                    <div className="col s12 input-field">
                        <input type="text" name="lobby" id="lobby" value={this.state.lobby} onChange={this.handleChange} />
                        <label htmlFor="lobby">Name:</label>
                    </div>

                    <div className="col s12">
                        <button className="btn right ml5" onClick={this.handleClick}>erstellen...</button>
                    </div>

                    <div className="col s12 left red-text">
                        {this.state.errorMessage && <p>{this.state.errorMessage}</p>}
                    </div>
                </div>
            </div>
        )
    }
}
