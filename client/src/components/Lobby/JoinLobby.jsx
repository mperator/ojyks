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
                    this.setState({ errorMessage: data.errorMessage });
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
            <div>
                <h1>Join</h1>
                {this.state.errorMessage && <span className="error">{this.state.errorMessage}</span>}
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Ersteller</th>
                            <th>Spieler</th>
                            <th>Status</th>
                            <th>Beitreten</th>
                        </tr>
                    </thead>

                    <tbody>
                        {this.state.lobbies && this.state.lobbies.map(l => (
                            <tr key={l.name}>
                                <td>{l.name}</td>
                                <td>{l.creator}</td>
                                <td>{l.users} / {l.slots}</td>
                                <td>{l.state}</td>
                                <td><button disabled={l.state !== "open"} onClick={(e) => this.handleClick(e, l.name)}>Join</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }
}
