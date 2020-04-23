import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { UserContext } from '../../context/user-context'

// displays all users
// user that is creator of lobby can start
// if start was done lobby is closed everyone is notified to navigate to game
// chat must be saved to usércontext to keep over session
export default class Lobby extends Component {
    static contextType = UserContext;

    constructor(prop) {
        super(prop);

        this.state = {
            lobby: null,
            message: ''
        }

        this.handleMessage = this.handleMessage.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSend = this.handleSend.bind(this);

        this.handleStart = this.handleStart.bind(this);
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    handleSend(e) {
        e.preventDefault();
        const message = { player: this.context.username, lobby: this.props.match.params.name, message: this.state.message };
        this.context.send({ type: 'request', action: 'lobby-message', payload: message });
        this.context.addMessage(message);

        this.setState({ message: "" });
    }

    handleMessage(data) {
        if (data.type !== 'response') return;

        switch (data.action) {
            case 'reconnect': 
                // this.context.send({ type: 'request', action: 'lobby-update', payload: { lobby: this.props.match.params.name } });

                this.context.send({
                    type: 'request',
                    action: 'lobby-join',
                    payload: {
                        lobby: data.payload.lobby,
                        player: {
                            name: this.context.username,
                            uuid: this.context.uuid
                        }
                    }
                });


            break;

            case 'lobby-update': {
                this.setState({ lobby: data.payload.lobby });
            } break;

            case 'lobby-message': {
                this.context.addMessage(data.payload)
            } break;

            case 'game-start': {
                this.props.history.push(`/game/${data.payload.lobby}`);
            } break;

            default:
                return;
        }
    }

    handleStart(e) {
        e.preventDefault();

        this.context.send({ type: 'request', action: 'game-start', payload: { lobby: this.state.lobby.name } })
    }

    componentDidMount() {
        this.context.registerCallback('lobbyMessageHandler', this.handleMessage);

        if(this.context.ws.readyState === this.context.ws.OPEN) {
            console.log("ready ready yet")
            
            this.context.send({ type: 'request', action: 'lobby-update', payload: { lobby: this.props.match.params.name } });

            // TODO: test if game is in progress then navigate to game

        } else {
            console.log("is not ready yet")
        }


    }

    componentWillUnmount() {
        this.context.unregisterCallback('lobbyMessageHandler');
    }

    render() {
        // TODO router guard
        if(!this.state.lobby) return null;

        return (
            <div className="lobby container">
                <div className="row">
                    <div className="col s12">
                        <h1>{this.state.lobby.name}</h1>
                    </div>

                    <div className="col m6 s12">
                        {this.state.lobby.creator === this.context.username &&
                            <button className="btn" onClick={this.handleStart}>starten...</button>
                        }
                        <h5>Benutzer in Lobby</h5>
                        {this.state.lobby &&
                            <ul>
                                {this.state.lobby.players && this.state.lobby.players.map((u, i) => (
                                    <li className="" key={i}>{u}</li>
                                ))}
                            </ul>}
                    </div>

                    <div className="col m6 s12">
                        <div className="input-field">
                            <input type="text" name="message" id="message" value={this.state.message} onChange={this.handleChange} />
                            <label htmlFor="message">Nachricht:</label>
                            <button className="btn" onClick={this.handleSend}>Senden</button>
                        </div>

                        <ul>
                            {this.context.chat.map((m, i) => (
                                <li key={i}>{m.player}: {m.message}</li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        )
    }
}
