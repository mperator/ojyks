import React, { Component } from 'react'

import createDeck, { cardTypes } from './gamelogic'
import Board from './Board';
import DrawPile from './DrawPile'
import DiscardPile from './DiscardPile';

import './Skyjo.css'

export default class Skyjo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            drawPile: [],
            boardCards: [],
            discardPile: [],

            state: null,
            instruction: ""
        }

        this.executeTurn = this.executeTurn.bind(this);
    }

    componentDidMount() {
        let drawPile = createDeck(cardTypes);
        //const boardCards = drawPile.splice(0, 12).map((card, i) => ({ cell: i, card: card}));
        const boardCards = drawPile.splice(0, 12).map(card => card);

        this.setState({
            drawPile: drawPile,
            discardPile: [],
            boardCards: boardCards,
            state: "init",
            instruction: "Decke zwei Karten auf..."
        });
    }

    // execution
    executeTurn(info) { // -> info about click on discard, click on draw or on any board
        switch (this.state.state) {
            case "init":
                if (info.source !== "board") return;
                // user has to select two cards draw and discard are deactivated

                const card = this.state.boardCards[info.cell];
                if (!card.faceDown) return;

                const cards = this.state.boardCards;
                cards[info.cell].faceDown = false;

                const count = cards.filter(card => !card.faceDown).length;
                const state = count === 2 ? "play" : "init";

                let instruction = "";
                switch (count) {
                    case 0:
                        instruction = "Decke zwei Karten auf...";
                        break;
                    case 1:
                        instruction = "Decke eine Karte auf...";
                        break;
                    case 2:
                        instruction = "Ziehe eine Karte vom Stapel oder decke eine weiter Karte auf..."
                        break;
                    default: throw "Error";
                }

                this.setState({
                    boardCards: cards,
                    state: state,
                    instruction: instruction
                });
                break;

            case "play":
                switch (info.source) {
                    case "board":
                        const card = this.state.boardCards[info.cell];
                        if (!card.faceDown) return;

                        const cards = this.state.boardCards;
                        cards[info.cell].faceDown = false;

                        this.setState({
                            boardCards: cards,
                            state: "play",
                            instruction: "Ziehe eine Karte vom Stapel oder decke eine weiter Karte auf..."
                        });
                        break;

                    case "draw":
                        // show first card on pile
                        const pile = this.state.drawPile;
                        // TODO: pile count > 0

                        pile[0].faceDown = false;

                        this.setState({
                            drawPile: pile,
                            state: "draw",
                            instruction: "Tausche mit einer Karte auf dem Feld oder lege sie auf den Ablagestapel..."
                        })
                        break;

                    case "discard":
                        if (this.state.discardPile.length === 0) return;

                        this.setState({
                            state: "discard",
                            instruction: "Decke eine Karte auf dem Feld auf..."
                        });
                        break;
                }

                break;

            case "draw":
                // user can exchange card from board or discard pile
                // if card is discard user has to open a card
                const drawPile = this.state.drawPile;
                const drawCard = drawPile.splice(0, 1)[0];

                switch (info.source) {
                    case "board":
                        const boardCards = this.state.boardCards;
                        const boardCard = boardCards[info.cell];
                        boardCard.faceDown = false;

                        boardCards[info.cell] = drawCard;

                        const discardPile = [boardCard, ...this.state.discardPile];

                        this.setState({
                            drawPile: drawPile,
                            boardCards: boardCards,
                            discardPile: discardPile,
                            state: "play",
                            instruction: "Ziehe eine Karte vom Stapel oder decke eine weiter Karte auf..."
                        })

                        break;

                    case "draw":
                        return;

                    case "discard":
                        this.setState({
                            drawPile: drawPile,
                            discardPile: [drawCard, ...this.state.discardPile],
                            state: "draw.open",
                            instruction: "Decke eine Karte auf dem Feld auf..."
                        })

                        break;
                }
                break;

            case "draw.open":

                switch (info.source) {
                    case "board":
                        const boardCards = this.state.boardCards;
                        const boardCard = boardCards[info.cell];

                        if (!boardCard.faceDown) return;

                        boardCards[info.cell].faceDown = false;

                        this.setState({
                            boardCards: boardCards,
                            state: "play",
                            instruction: "Ziehe eine Karte vom Stapel oder decke eine weiter Karte auf..."
                        })

                        break;

                    case "draw":
                        return;

                    case "discard":
                        return;
                }
                break;

            case "discard":
                var discardPile = this.state.discardPile;
                var discardCard = discardPile.splice(0, 1)[0];

                switch (info.source) {
                    case "board":
                        const boardCards = this.state.boardCards;
                        const boardCard = boardCards[info.cell];
                        boardCard.faceDown = false;

                        boardCards[info.cell] = discardCard;

                        this.setState({
                            boardCards: boardCards,
                            discardPile: [boardCard, ...discardPile],
                            state: "play",
                            instruction: "Ziehe eine Karte vom Stapel oder decke eine weiter Karte auf...",

                        })
                        break;

                    case "draw":
                        return;

                    case "discard":
                        return;
                }
                break;

        }

        // { source: '', card: value, id, boardplace id}

        // card.source -> deck, pile, disc

        // remove cards if multiple in a row

        // all that are not null

        // 0 1  2  3
        // 4 5  6  7
        // 8 9 10 11

        const boardCards = this.state.boardCards;
        if (boardCards[0] && boardCards[0].value === boardCards[4].value && boardCards[0].value === boardCards[8].value) {
            boardCards[0] = null;
            boardCards[4] = null;
            boardCards[8] = null;

            // TODO add to discard pile
        }
        if (boardCards[1] && boardCards[1].value === boardCards[5].value && boardCards[1].value === boardCards[9].value) {
            boardCards[1] = null;
            boardCards[5] = null;
            boardCards[9] = null;

            // TODO add to discard pile
        }
        if (boardCards[2] && boardCards[2].value === boardCards[6].value && boardCards[2].value === boardCards[10].value) {
            boardCards[2] = null;
            boardCards[6] = null;
            boardCards[10] = null;

            // TODO add to discard pile
        }
        if (boardCards[3] && boardCards[3].value === boardCards[7].value && boardCards[3].value === boardCards[11].value) {
            boardCards[3] = null;
            boardCards[7] = null;
            boardCards[11] = null;

            // TODO add to discard pile
        }

        // TODO add 

        this.setState({ boardCards: boardCards })

        // check for game end
        const cardsNotNull = this.state.boardCards.filter(c => c !== null);
        console.log(cardsNotNull)

        const cardsOpened = cardsNotNull.filter(c => !c.faceDown);
        console.log(cardsNotNull)

        if (cardsOpened.length === cardsNotNull.length) {
            this.setState({
                state: "end",
                instruction: "Spiel beendet, drücke F5 oder lade die Seite neu..."
            })
        }
    }

    render() {
        return (
            <div className="container">
                <div className="player">
                    <div className="pile">
                        <div>
                            {/* <p>{this.state.state}</p> */}
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
                <div className="chat">chat</div>
            </div>
        )
    }
}
