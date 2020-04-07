import React from 'react'

import Card from './Card'
import './Board.css'

export default function Board(props) {
    // click card tu turn, to swap
    return (
        <div className="board">
            {props.cards.map((card, i) => (
                <Card card={card} key={i} cell={i} handleClick={props.handleClick}/>
            ))}
        </div>
    )
}
