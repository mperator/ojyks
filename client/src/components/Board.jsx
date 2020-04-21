import React from 'react'

import Card from './Card'
import './Board.css'

export default function Board(props) {
    // click card tu turn, to swap
    return (
        <div className="board2">
            {props.cards.map((card, i) => 
                <div className="board-card-place" key={i}>
                    {card && <Card card={card} cell={i} handleClick={props.handleClick} source="board"/>}
                </div>
            )}
        </div>
    )
}
