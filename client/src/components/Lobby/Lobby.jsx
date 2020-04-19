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
            lobby: {
                // name: '',
                // creator: '',
                // slots: 0,
                // state: '',
                // users: []
            },
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
        const message = { user: this.context.username, lobby: this.props.match.params.name, message: this.state.message };
        this.context.send({ type: 'request', action: 'message-lobby', payload: message });
        this.context.addMessage(message);

        this.setState({ message: "" });
    }

    handleMessage(data) {
        if (data.type !== 'response') return;

        switch (data.action) {
            case 'update-lobby': {
                console.log("lobby update", data);
                this.setState({ lobby: data.payload.lobby });
            } break;

            case 'message-lobby': {
                this.context.addMessage(data.payload)
            } break;

            case 'start-game': {
                this.props.history.push(`/game/${data.payload.lobby}`);
            } break;

            default:
                return;
        }
    }

    handleStart(e) {
        e.preventDefault();

        this.context.send({ type: 'request', action: 'start-game', payload: { lobby: this.state.lobby.name } })
    }

    componentDidMount() {
        if (!this.context.username) return;

        this.context.registerCallback('lobbyMessageHandler', this.handleMessage);

        this.context.send({ type: 'request', action: 'update-lobby', payload: { lobbyname: this.props.match.params.name } });
    }

    componentWillUnmount() {
        this.context.unregisterCallback('lobbyMessageHandler');
    }

    render() {
        // TODO router guard
        if (!this.context.username) return (<Redirect to="/" />);

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
                                {this.state.lobby.users && this.state.lobby.users.map((u, i) => (
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
                                <li key={i}>{m.user}: {m.message}</li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        )
    }
}
