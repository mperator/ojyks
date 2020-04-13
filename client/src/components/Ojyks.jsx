import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

import createDeck, { cardTypes } from './gamelogic'
import Board from './Board';
import DrawPile from './DrawPile'
import DiscardPile from './DiscardPile';

import { UserContext } from '../context/user-context'

import './Ojyks.css'

export default class Ojyks extends Component {
    static contextType = UserContext

    constructor(props) {
        super(props);

        this.state = {
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

                //const currentPlayer = payload.players.find(p => p.name === payload.currentPlayer);

                this.setState({
                    drawPile: payload.drawPile,
                    discardPile: payload.discardPile,

                    boardCards: player.cards,
                    state: player.state,

                    //currentPlayerCards: currentPlayer.cards
                });

            } break;

            case 'message-lobby': {
                this.context.addMessage(data.payload)
            } break;
        }
    }

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

        // const boardCards = this.state.boardCards;
        // if (boardCards[0] && boardCards[0].value === boardCards[4].value && boardCards[0].value === boardCards[8].value) {
        //     boardCards[0] = null;
        //     boardCards[4] = null;
        //     boardCards[8] = null;

        //     // TODO add to discard pile
        // }
        // if (boardCards[1] && boardCards[1].value === boardCards[5].value && boardCards[1].value === boardCards[9].value) {
        //     boardCards[1] = null;
        //     boardCards[5] = null;
        //     boardCards[9] = null;

        //     // TODO add to discard pile
        // }
        // if (boardCards[2] && boardCards[2].value === boardCards[6].value && boardCards[2].value === boardCards[10].value) {
        //     boardCards[2] = null;
        //     boardCards[6] = null;
        //     boardCards[10] = null;

        //     // TODO add to discard pile
        // }
        // if (boardCards[3] && boardCards[3].value === boardCards[7].value && boardCards[3].value === boardCards[11].value) {
        //     boardCards[3] = null;
        //     boardCards[7] = null;
        //     boardCards[11] = null;

        //     // TODO add to discard pile
        // }

        // this.setState({ boardCards: boardCards })

        // check for game end
        // const cardsNotNull = this.state.boardCards.filter(c => c !== null);

        // const cardsOpened = cardsNotNull.filter(c => !c.faceDown);

        // if (cardsOpened.length === cardsNotNull.length) {
        //     // this.setState({
        //     //     state: "end",
        //     //     instruction: "Spiel beendet, drücke F5 oder lade die Seite neu..."
        //     // })
        // }
    }

    render() {
        if (!this.context.username) return (<Redirect to="/" />)
        if (this.state.state === null) return (<div>loading...|{this.state.lobby}|{this.context.username} </div>)

        return (
            <div className="container">
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
                <div className="room">room</div>
                <div className="chat">chat
                
                </div>
            </div>
        )
    }
}
