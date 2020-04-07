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
                {card.faceDown ? 
                <p>#</p> : 
                <p>{card.value}</p>
                }
            </div>
        )
    }
}
