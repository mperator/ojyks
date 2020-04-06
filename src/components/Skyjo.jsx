import React, { Component } from 'react'

import createDeck, { cardTypes } from './gamelogic'
import Board from './Board';
import DrawPile from './DrawPile'
import DiscardPile from './DiscardPile';

export default class Skyjo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            deck: [],
            cards: [],
            discards: [],

            selectedCard: null,
            state: null,
        }
    }

    componentDidMount() {
        const deck = createDeck(cardTypes);

        var cards = deck.splice(0, 12);

        this.setState({
            deck: deck,
            cards: cards
        });
    }

    selectedCard(card) {
        // card.source -> deck, pile, disc


    }

    render() {
        return (
            <div>
                <h1>Skyjo</h1>

                <DrawPile cards={this.state.deck} />
                <DiscardPile cards={this.state.discards} />

                <br/>


                {this.state.cards.length > 0 && <Board cards={this.state.cards} />}

            </div>
        )
    }
}
