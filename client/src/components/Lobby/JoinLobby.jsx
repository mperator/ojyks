import React, { Component } from 'react'

import { UserContext } from '../../context/user-context'

// shows a list of currently active lobbies
export default class JoinLobby extends Component {
    static contextType = UserContext;

    constructor(props) {
        super(props);

        this.state = {
            lobbies: []
        }

        this.handleMessage = this.handleMessage.bind(this);
    }

    handleMessage(data) {
        if (data.type !== 'response' &&
            data.action !== 'update-lobbies') return;

        this.setState({ lobbies: data.data.lobbies });
    }

    componentDidMount() {
        this.context.registerCallback('joinLobbyMessageHandler', this.handleMessage);

        this.context.send({ type: 'request', action: 'update-lobbies' });
    }

    componentWillUnmount() {
        this.context.unregisterCallback('joinLobbyMessageHandler');
    }

    render() {
        return (
            <div>
                <h1>Join</h1>

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
                                <td><button disabled={l.state!=="open"}>Join</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }
}
