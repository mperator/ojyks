import React, { Component } from 'react';
import { Link } from 'react-router-dom'

import Chat from './Chat';
import CardDeck from './CardDeck';
import DrawPile from './DrawPile';
import DiscardPile from './DiscardPile';
import StateDisplay from './StateDisplay';

import { UserContext } from '../context/user-context'

import locals from './Ojyks.module.css'
// import { data } from './ojyks-mock'

export default class Ojyks extends Component {
    static contextType = UserContext

    constructor(props) {
        super(props);

        this.state = {
            players: [],


            drawPile: [],
            boardCards: [],
            discardPile: [],

            state: null,
            instruction: "",

            lobby: props.match.params.name,

            currentPlayerCards: [],
            message: ''
        }

        this.executeTurn = this.executeTurn.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleQuit = this.handleQuit.bind(this);
    }

    handleQuit(e) {
        e.preventDefault();

        this.context.send({
            type: 'request',
            action: 'lobby-leave',
            payload: {
                lobby: this.props.match.params.name,
                player: {
                    name: this.context.username,
                    uuid: this.context.uuid
                }
            }
        });

        this.props.history.push(`/login`);
    }

    handleMessage(data) {
        const { type, action, payload } = data;
        if (type !== 'response') return;

        switch (action) {
            case 'reconnect':
                if (payload.lobby) {
                    if (payload.gameState === 'active') {
                        this.context.send({
                            type: 'request',
                            action: 'game-state',
                            payload: {
                                lobby: this.props.match.params.name,
                                player: {
                                    name: this.context.username,
                                    uuid: this.context.uuid
                                }
                            }
                        });
                    } else {
                        this.props.history.push(`/lobby/${payload.lobby}`);
                    }
                } else {
                    // if no lobby was specified refresh data on page
                    this.props.history.push(`/lobby/join`);
                }
                break;

            case 'game-state':
                const player = payload.players.find(p => p.name === this.context.username);

                this.setState({
                    drawPile: payload.drawPile,
                    discardPile: payload.discardPile,

                    boardCards: player.cards,
                    state: player.state,

                    players: payload.players
                });

                break;

            case 'lobby-message':
                this.context.addMessage(data.payload)
                break;

            case 'lobby-closed':
                this.props.history.push(`/lobby/join`);
                break;
    

            default:
                return;
        }
    }

    componentDidMount() {
        this.context.registerCallback('gameMessageHandler', this.handleMessage);

        if (this.context.ws.readyState === this.context.ws.OPEN) {
            this.context.send({
                type: 'request',
                action: 'game-state',
                payload: {
                    lobby: this.props.match.params.name,
                    player: {
                        name: this.context.username,
                        uuid: this.context.uuid
                    }
                }
            });
        }
    }

    componentWillUnmount() {
        this.context.unregisterCallback('gameMessageHandler');
    }

    // execution
    executeTurn(info) { // -> info about click on discard, click on draw or on any board
        switch (this.state.state) {
            case "init":
                // user has to select two cards draw and discard are deactivated
                if (info.source !== "board") return;

                this.context.send({
                    type: 'request', action: 'game-turn',
                    payload: {
                        lobby: this.state.lobby,
                        user: this.context.username,
                        source: info.source,
                        cardIndex: info.cardIndex
                    }
                })
                break;

            case "play":
                this.context.send({
                    type: 'request', action: 'game-turn',
                    payload: {
                        lobby: this.state.lobby,
                        user: this.context.username,
                        source: info.source,
                        cardIndex: info.cardIndex
                    }
                });
                break;

            case "draw":
                // board or discard
                this.context.send({
                    type: 'request', action: 'game-turn',
                    payload: {
                        lobby: this.state.lobby,
                        user: this.context.username,
                        source: info.source,
                        cardIndex: info.cardIndex
                    }
                });
                break;

            case "draw.open":
                // board only
                this.context.send({
                    type: 'request', action: 'game-turn',
                    payload: {
                        lobby: this.state.lobby,
                        user: this.context.username,
                        source: info.source,
                        cardIndex: info.cardIndex
                    }
                });
                break;

            case "discard":
                // board only
                this.context.send({
                    type: 'request', action: 'game-turn',
                    payload: {
                        lobby: this.state.lobby,
                        user: this.context.username,
                        source: info.source,
                        cardIndex: info.cardIndex
                    }
                });
                break;

            case "ready":
            default:
                return;
        }
    }

    render() {
        if (this.state.state === null) return (<div>loading...|{this.state.lobby}|{this.context.username}|{this.context.networkState} </div>)

        return (
            <div className="container">
                <div className="row">
                    <button className="btn red right" onClick={this.handleQuit}>RAGE QUIT</button>
                </div>
                <div className="row">
                    <div className={`ol s12 ${locals.overflowContainer}`}>
                        {this.state.players && this.state.players.map((player, i) => (
                            <div key={i} className={locals.deckContainer}>
                                <div><CardDeck cards={player.cards} small /></div>
                                <p className={`${locals.name} ${!player.online && locals.offline}`}>{player.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="row">
                    <div className="col s12">
                        <div className={locals.drawDiscardContainer}>
                            <DrawPile cards={this.state.drawPile} handleClick={this.executeTurn} />
                            <DiscardPile cards={this.state.discardPile} handleClick={this.executeTurn} />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col s12">
                        <StateDisplay state={this.state} />
                        {this.state.state === "score" &&
                            <Link to={`/lobby/${this.props.match.params.name}`}>To Score Screen...</Link>}
                    </div>
                </div>
                <div className="row">
                    <div className="col s12">
                        {this.state.boardCards.length > 0 &&
                            <CardDeck cards={this.state.boardCards} handleClick={this.executeTurn} />
                        }
                    </div>
                </div>
                <div className="row">
                    <div className="col s12">
                        <Chat context={this.context} lobby={this.props.match.params.name} />
                    </div>
                </div>
            </div>
        );
    }
}
