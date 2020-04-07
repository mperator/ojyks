import React, { Component } from 'react'

// todo card index
// is visible 
// value
export default class Card extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {card, cell}  = this.props;
        return (
            <div onClick={() => this.props.handleClick({source: "board", cell: cell})}>
                <p>{cell}</p>
                <p>{card.id}</p>
                <p>{card.value}</p>
                <p>{card.faceDown.toString()}</p>
            </div>
        )
    }
}
