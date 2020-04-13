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

    handleClick(e, lobbyname) {
        e.preventDefault();

        this.context.send({ type: 'request', action: 'join-lobby', payload: { user: this.context.username, lobby: lobbyname } });
    }

    handleMessage(data) {
        if (data.type !== 'response') return;

        switch (data.action) {
            case 'update-lobbies':
                this.setState({ lobbies: data.payload.lobbies });
                break;
            case 'join-lobby':
                if (data.state === "success") {
                    console.log("join-lobby", data)
                    this.props.history.push(`/lobby/${data.payload.lobby}`);
                } else {
                    this.setState({ errorMessage: "Fehler: " + data.errorMessage });
                }
                break;
            default:
                return;
        }
    }

    componentDidMount() {
        if (!this.context.username) return;

        this.context.registerCallback('joinLobbyMessageHandler', this.handleMessage);

        this.context.send({ type: 'request', action: 'update-lobbies' });
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
                                        <td>{l.users} / {l.slots}</td>
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
