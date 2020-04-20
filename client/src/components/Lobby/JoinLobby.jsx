import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

import { UserContext } from '../../context/user-context'

// shows a list of currently active lobbies
export default class JoinLobby extends Component {
    static contextType = UserContext;

    constructor(props) {
        super(props);

        this.state = {
            lobbies: [],
            errorMessage: ""
        }

        this.handleMessage = this.handleMessage.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e, lobbyName) {
        e.preventDefault();

        this.context.send({
            type: 'request', 
            action: 'lobby-join',
            payload: {
                lobby: lobbyName,
                player: {
                    name: this.context.username
                }
            }
        });
    }

    handleMessage(data) {
        const { type, action, state, payload, errorMessage } = data;

        if (type !== 'response') return;
        switch (action) {
            case 'lobby-overview':
                this.setState({ lobbies: payload.lobbies });
                break;
            case 'lobby-join':
                if (state === "success") {
                    console.log("lobby-join", data)
                    this.props.history.push(`/lobby/${payload.lobby.name}`);
                } else {
                    this.setState({ errorMessage: "Fehler: " + errorMessage });
                }
                break;
            default:
                return;
        }
    }

    componentDidMount() {
        if (!this.context.username) return;

        this.context.registerCallback('joinLobbyMessageHandler', this.handleMessage);

        this.context.send({ type: 'request', action: 'lobby-overview' });
    }

    componentWillUnmount() {
        this.context.unregisterCallback('joinLobbyMessageHandler');
    }

    render() {
        // TODO router guard
        if (!this.context.username) return (<Redirect to="/" />);

        return (
            <div className="lobby-join container">
                <div className="row">
                    <div className="col s12">
                        <h1>Lobby beitreten</h1>
                        <p className="flow-text">
                            Trete einer Lobby bei.
                        </p>
                    </div>

                    <div className="col s12">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Ersteller</th>
                                    <th>Spieler</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {this.state.lobbies && this.state.lobbies.map(l => (
                                    <tr key={l.name}>
                                        <td>{l.name}</td>
                                        <td>{l.creator}</td>
                                        <td>{l.playerCount} / {l.slots}</td>
                                        <td>{l.state}</td>
                                        <td><button className="btn" disabled={l.state !== "open"} onClick={(e) => this.handleClick(e, l.name)}>beitreten...</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="col s12 left text-red">
                    {this.state.errorMessage ? <p>{this.state.errorMessage}</p> : null}
                </div>
            </div>
        )
    }
}
