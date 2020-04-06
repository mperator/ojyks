import React from 'react'
import Card from './Card'

export default function DrawPile(props) {
    return (
        <div>
            <p>{props.cards.length}</p>
            <p>{props.cards.length > 0 &&
            props.cards[0]}</p>
        </div>
    )
}
