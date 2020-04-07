import React, { Component } from 'react'

import createDeck, { cardTypes } from './gamelogic'
import Board from './Board';
import DrawPile from './DrawPile'
import DiscardPile from './DiscardPile';

export default class Skyjo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            drawPile: [],
            boardCards: [],
            discardPile: [],

            state: null,
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
            state: "init"
        });
    }

    // execution
    executeTurn(info) { // -> info about click on discard, click on draw or on any board
        switch (this.state.state) {
            case "init":
                if (info.source !== "board") return;
                // user has to select two cards draw and discard are deactivated
                console.log(this.state.boardCards)

                const card = this.state.boardCards[info.cell];
                if (!card.faceDown) return;

                const cards = this.state.boardCards;
                cards[info.cell].faceDown = false;

                const count = cards.filter(card => !card.faceDown).length;
                console.log(count)
                const state = count === 2 ? "play" : "init";

                this.setState({
                    boardCards: cards,
                    state: state
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
                            state: "play"
                        });
                        break;

                    case "draw":
                        // show first card on pile
                        const pile = this.state.drawPile;
                        // TODO: pile count > 0

                        pile[0].faceDown = false;

                        this.setState({
                            drawPile: pile,
                            state: "draw"
                        })
                        break;



                    case "discard":
                        if(this.state.discardPile.length === 0) return;

                        this.setState({state: "discard"});
                        break;
                }


                break;

            case "draw":
                // user can exchange card from board or discard pile
                // if card is discard user has to open a card
                const drawPile = this.state.drawPile;
                const drawCard = drawPile.splice(0, 1)[0];

                console.log(drawPile)
                console.log(drawCard)

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
                            state: "play"
                        })

                        break;

                    case "draw":
                        return;

                    case "discard":
                        this.setState({
                            drawPile: drawPile,
                            discardPile: [drawCard, ...this.state.discardPile],
                            state: "draw.open"
                        })

                        break;
                }
                break;

            case "draw.open":
                
                switch (info.source) {
                    case "board":
                        const boardCards = this.state.boardCards;
                        const boardCard = boardCards[info.cell];
                        
                        if(!boardCard.faceDown) return;

                        boardCards[info.cell].faceDown = false;

                        this.setState({
                            boardCards: boardCards,
                            state: "play"
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
                            state: "play"
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

    }

    render() {
        return (
            <div>
                <p>{this.state.state}</p>
                <h1>Skyjo</h1>

                <DrawPile cards={this.state.drawPile} handleClick={this.executeTurn} />
                <DiscardPile cards={this.state.discardPile} handleClick={this.executeTurn} />

                <br />


                {this.state.boardCards.length > 0 && <Board cards={this.state.boardCards} handleClick={this.executeTurn} />}

            </div>
        )
    }
}
