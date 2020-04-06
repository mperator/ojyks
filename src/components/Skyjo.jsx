import React, { Component } from 'react'

import createDeck, { cardTypes } from './gamelogic'
import Board from './Board';

export default class Skyjo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            deck: [],
            cards: [],
            discards: []
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

    render() {
        return (
            <div>
                <h1>Skyjo</h1>


                {this.state.cards.length > 0 && <Board cards={this.state.cards} />}

            </div>
        )
    }
}
