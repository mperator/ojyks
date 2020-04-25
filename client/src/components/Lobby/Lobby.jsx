import React, { Component } from 'react';
import Chat from '../Chat';
import { UserContext } from '../../context/user-context'
import locals from './Lobby.module.css'

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
                this.setState({ lobby: payload.lobby });
                break;

            case 'lobby-message':
                this.context.addMessage(payload)
                break;

            case 'game-start':
                this.props.history.push(`/game/${payload.lobby}`);
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

        function renderScoreHead(scores) {
            return (
                <thead>
                    <tr>
                        <td>Player</td>
                        {scores && scores.map(s => (
                            <td key={s.uuid}>{s.name}</td>
                        ))}
                    </tr>
                </thead>
            )
        };

        function renderScoreTotalSum(scores) {
            return (
                <tr>
                    <td>Total</td>
                    {scores && scores.map(s => (
                        <td key={s.uuid}>
                            {s.rounds.map(r => r.value).reduce((a, c) => a + c)}
                        </td>
                    ))}
                </tr>
            )
        }

        function renderScoreRounds(scores) {
            if (!scores || scores.length === 0)
                return null;

            const numOfRounds = scores[0].rounds.length;
            const rounds = [];

            for (let i = 0; i < numOfRounds; i++) {
                const scoresPerRound = [];
                for (const player of scores) {
                    scoresPerRound.push(player.rounds[i]);
                }
                rounds.push(scoresPerRound);
            }

            function getClassName(s) {
                const classes = [];
                if(s.end) classes .push(locals.end);
                if(s.doubled) classes.push(locals.doubled);
                return classes.join(' ');
            }

            return (
                rounds.map((r, i) => (
                    <tr key={i}>
                        <td>{i + 1}</td>
                        {r.map((s, j) => (
                            <td key={`${i}_${j}`}>
                                <span className={getClassName(s)}>{s.value
                                }</span>
                            </td>
                        ))}
                    </tr>
                ))
            )
        }

        return (
            <div className="container" >
                <div className="row">
                    <div className="col s12">
                        <h1>{this.state.lobby.name}</h1>
                    </div>

                    <div className="col m8 s12">
                        {this.state.lobby.creator === this.context.username &&
                            <button className="btn" onClick={this.handleStart}>starten...</button>}
                        
                        {this.state.lobby &&
                        this.state.lobby.scores && this.state.lobby.scores.length === 0
                        &&
                            <ul>
                                {this.state.lobby.players && this.state.lobby.players.map((u, i) => (
                                    <li key={i}>{u}</li>
                                ))}
                            </ul>}


                        {this.state.lobby &&
                        this.state.lobby.scores && this.state.lobby.scores.length > 0 &&
                        <table>
                            {renderScoreHead(this.state.lobby.scores)}
                            <tbody>
                                {renderScoreTotalSum(this.state.lobby.scores)}
                                {renderScoreRounds(this.state.lobby.scores)}
                            </tbody>
                        </table>}
                    </div>

                    <div className="col m4 s12">
                        <Chat context={this.context} lobby={this.props.match.params.name} />
                    </div>

                </div>
            </div>
        )
    }
}
