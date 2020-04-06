import React from 'react'

import Card from './Card'

export default function Board(props) {
    // click card tu turn, to swap
    return (
        <div>
            {props.cards.map((card, i) => (
                <Card card={card} key={i} />
            ))}
        </div>
    )
}
