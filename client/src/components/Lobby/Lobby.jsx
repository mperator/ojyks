import React, { Component } from 'react';

import Chat from '../Chat';

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
        this.handleStart = this.handleStart.bind(this);
    }

    handleMessage(data) {
        const { type, action, payload } = data;
        if (type !== 'response') return;
        switch (action) {
            case 'reconnect':
                if (payload.lobby) {
                    if (payload.gameState === 'active') {
                        this.props.history.push(`/game/${payload.lobby}`);
                    } else {
                        this.context.send({
                            type: 'request',
                            action: 'lobby-update',
                            payload: {
                                lobby: this.props.match.params.name
                            }
                        });
                    }
                } else {
                    // no lobby specified player will be redirect to lobby overview
                    this.props.history.push(`/lobby/join`);
                }
                break;

            case 'lobby-update':
                this.setState({ lobby: data.payload.lobby });
                break;

            case 'lobby-message':
                this.context.addMessage(data.payload)
                break;

            case 'game-start':
                this.props.history.push(`/game/${data.payload.lobby}`);
                break;

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

        if (this.context.ws.readyState === this.context.ws.OPEN) {
            this.context.send({ type: 'request', action: 'lobby-update', payload: { lobby: this.props.match.params.name } });
        }
    }

    componentWillUnmount() {
        this.context.unregisterCallback('lobbyMessageHandler');
    }

    render() {
        // TODO router guard
        if (!this.state.lobby) return null;

        return (
            <div className="container">
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
                                    <li key={i}>{u}</li>
                                ))}
                            </ul>}
                    </div>

                    <div className="col m6 s12">
                        <Chat context={this.context} lobby={this.props.match.params.name} />
                    </div>

                </div>
            </div>
        )
    }
}
