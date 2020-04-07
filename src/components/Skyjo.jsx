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
        switch(this.state.state) {
            case "init": 

                if(info.source !== "board") return;
                // user has to select two cards draw and discard are deactivated
                console.log(this.state.boardCards)
                
                const card = this.state.boardCards[info.cell];
                if(!card.faceDown) return;

                const cards = this.state.boardCards;
                cards[info.cell].faceDown = false;
                
                const count = cards.filter(card => !card.faceDown).length;
                console.log(count)
                const state = count === 2 ? "play" : "init";

                this.setState({
                    boardCards: cards,
                    state: state
                });

                
                
                
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
                <p>{this.state.state}</p>
                <h1>Skyjo</h1>

                <DrawPile cards={this.state.drawPile} handleClick={this.executeTurn} />
                <DiscardPile cards={this.state.discardPile} handleClick={this.executeTurn} />

                <br/>


               {this.state.boardCards.length > 0 && <Board cards={this.state.boardCards} handleClick={this.executeTurn} />}

            </div>
        )
    }
}
