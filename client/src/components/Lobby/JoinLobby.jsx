import React, { Component } from 'react'
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
        this.handleCreateClick = this.handleCreateClick.bind(this);

        this.getLobbiesToReconnect = this.getLobbiesToReconnect.bind(this);
        this.getLobbiesToConnect = this.getLobbiesToConnect.bind(this);
    }

    handleClick(e, lobbyName) {
        e.preventDefault();

        this.context.send({
            type: 'request',
            action: 'lobby-join',
            payload: {
                lobby: lobbyName,
                player: {
                    name: this.context.username,
                    uuid: this.context.uuid
                }
            }
        });
    }

    handleCreateClick(e) {
        e.preventDefault();

        this.props.history.push("/lobby/create");
    }

    handleMessage(data) {
        const { type, action, state, payload, errorMessage } = data;

        if (type !== 'response') return;
        switch (action) {
            case 'reconnect':
                if (payload.lobby) {
                    if (payload.gameState === 'active') {
                        this.props.history.push(`/game/${payload.lobby}`);
                    } else {
                        this.props.history.push(`/lobby/${payload.lobby}`);
                    }
                } else {
                    // if no lobby was specified refresh data on page
                    this.context.send({ type: 'request', action: 'lobby-overview' });
                }
                break;

            case 'lobby-overview':
                this.setState({ lobbies: payload.lobbies });
                break;
            case 'lobby-join':
                if (state === "success") {
                    this.props.history.push(`/lobby/${payload.lobby.name}`);
                } else {
                    this.setState({ errorMessage: "Fehler: " + errorMessage });
                }
                break;
            case 'game-start':
                if (state === "success") {
                    this.props.history.push(`/game/${payload.lobby}`);
                } else {
                    this.setState({ errorMessage: "Fehler: " + errorMessage });
                }
                break;
            default:
                return;
        }
    }

    componentDidMount() {
        this.context.registerCallback('joinLobbyMessageHandler', this.handleMessage);

        if(this.context.ws.readyState === this.context.ws.OPEN) {

            this.context.send({
                type: "response",
                action: "reconnect",
                payload: {
                    player: {
                        uuid: this.context.uuid
                    }
                }
            });
        }
    }

    componentWillUnmount() {
        this.context.unregisterCallback('joinLobbyMessageHandler');
    }

    getLobbiesToReconnect() {
        // get all lobbies where player is in lobby
        const lobbiesToReconnect = this.state.lobbies.filter(l => l.players && l.players.find(p => p.uuid === this.context.uuid));
        if (!lobbiesToReconnect) return null;

        return (lobbiesToReconnect.map(l => (
            <tr key={l.name}>
                <td>{l.name}</td>
                <td>{l.creator}</td>
                <td>{l.players.length} / {l.slots}</td>
                <td>{l.state}</td>
                <td><button className="btn" onClick={(e) => this.handleClick(e, l.name)}>wiederbeitreten...</button></td>
            </tr>
        )));
    }

    getLobbiesToConnect() {
        const lobbiesToConnect = this.state.lobbies.filter(l => l.players && !l.players.find(p => p.uuid === this.context.uuid));
        if (!lobbiesToConnect) return null;

        return (lobbiesToConnect.map(l => (
            <tr key={l.name}>
                <td>{l.name}</td>
                <td>{l.creator}</td>
                <td>{l.players.length} / {l.slots}</td>
                <td>{l.state}</td>
                <td><button className="btn" disabled={l.state !== "open"} onClick={(e) => this.handleClick(e, l.name)}>beitreten...</button></td>
            </tr>
        )));
    }

    render() {
        return (
            <div className="container">
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
                                {this.getLobbiesToReconnect()}
                                {this.getLobbiesToConnect()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="input-field col s12">
                    <button className="btn right ml5" name="create" onClick={this.handleCreateClick}>Erstellen...</button>
                </div>

                <div className="col s12 left text-red">
                    {this.state.errorMessage ? <p>{this.state.errorMessage}</p> : null}
                </div>
            </div>
        )
    }
}
