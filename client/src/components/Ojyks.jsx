import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

import createDeck, { cardTypes } from './gamelogic'
import Board from './Board';
import DrawPile from './DrawPile'
import DiscardPile from './DiscardPile';

import { UserContext } from '../context/user-context'

import './Ojyks.css'
import data from './ojyks-mock'

export default class Ojyks extends Component {
    static contextType = UserContext

    constructor(props) {
        super(props);

        console.log(data)

        this.state = {
            players: [],


            drawPile: [],
            boardCards: [],
            discardPile: [],

            state: null,
            instruction: "",

            lobby: props.match.params.name,

            currentPlayerCards: []
        }



        this.executeTurn = this.executeTurn.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    handleMessage(data) {
        if (data.type !== 'response') return;

        switch (data.action) {
            case 'game-state': {
                const { payload } = data;
                console.log("game state", data);

                const player = payload.players.find(p => p.name === this.context.username);
                const others = payload.players.filter(p => p.name !== this.context.username);
                //const currentPlayer = payload.players.find(p => p.name === payload.currentPlayer);

                this.setState({
                    drawPile: payload.drawPile,
                    discardPile: payload.discardPile,

                    boardCards: player.cards,
                    state: player.state,

                    players: others
                    //currentPlayerCards: currentPlayer.cards
                });

            } break;

            case 'message-lobby': {
                this.context.addMessage(data.payload)
            } break;
        }
    }

    // componentDidMount() {
    //     this.setState({
    //         drawPile: data.drawPile,
    //         boardCards: data.boardCards,
    //         discardPile: data.discardPile,

    //         state: data.state,

    //         players: data.players
    //     })
    // }

    componentDidMount() {
        if (!this.context.username) return;

        this.context.registerCallback('gameMessageHandler', this.handleMessage);
        this.context.send({ type: 'request', action: 'game-state', payload: { lobby: this.state.lobby } });
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
                        cardIndex: info.cell
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
                        cardIndex: info.cell
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
                        cardIndex: info.cell
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
                        cardIndex: info.cell
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
                        cardIndex: info.cell
                    }
                });
                break;

            case "ready":
            default:
                return;
        }
    }

    render() {
        if (!this.context.username) return (<Redirect to="/" />)
        if (this.state.state === null) return (<div>loading...|{this.state.lobby}|{this.context.username} </div>)

        return (

            <div className="container2">
                <div className="player">
                    <div className="pile">
                        <div>
                            <p>{this.state.state}</p>
                        </div>
                        <DrawPile cards={this.state.drawPile} handleClick={this.executeTurn} />
                        <DiscardPile cards={this.state.discardPile} handleClick={this.executeTurn} />
                        <div></div>
                    </div>
                    <div className="state">
                        <p>{this.state.instruction}</p>
                    </div>
                    <div className="game">
                        {this.state.boardCards.length > 0 && <Board cards={this.state.boardCards} handleClick={this.executeTurn} />}
                    </div>
                </div>
                <div className="room">
                    {this.state.players && this.state.players.map(p => (
                        <div>
                            <div><Board cards={p.cards} /></div>
                            <p>{p.name}</p>
                        </div>
                    ))}
                </div>
                <div className="chat">chat

                </div>
            </div>
        )
    }
}
