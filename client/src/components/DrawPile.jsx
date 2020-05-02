import React from 'react'
import Card from './Card'

export default function DrawPile(props) {
    const selected = props.state === "draw"
    return (
        <div>
            {props.cards.length > 0 && (
                <Card card={props.cards[0]} cardIndex={-1} handleClick={props.handleClick} source="draw" selected={selected}/>
            )}
        </div>
    )
}
