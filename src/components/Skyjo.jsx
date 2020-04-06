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
    }

    componentDidMount() {
        let drawPile = createDeck(cardTypes);
        const boardCards = drawPile.splice(0, 12).map((card, i) => ({ cell: i, card: card}));

        this.setState({
            drawPile: drawPile,
            discardPile: [],
            boardCards: boardCards,
            state: "init"
        });
    }

    // execution
    selectedCard(info) {
        switch(this.state.state) {
            case "init": 
                // user has to select two cards draw and discard are deactivated

                // open, face down

                // filter for open cards
                // set next state
            break;
        }

// { source: '', card: value, id, boardplace id}

        // card.source -> deck, pile, disc


    }

    render() {
        return (
            <div>
                <h1>Skyjo</h1>

                <DrawPile cards={this.state.drawPile} />
                <DiscardPile cards={this.state.discardPile} />

                <br/>


               {this.state.boardCards.length > 0 && <Board cards={this.state.boardCards} />}

            </div>
        )
    }
}
