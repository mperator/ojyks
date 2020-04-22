import React from 'react'
import Card from './Card'
import './DrawPile.css'

export default function DrawPile(props) {
    return (
        <div>
            {props.cards.length > 0 && (
                <Card card={props.cards[0]} cardIndex={-1} handleClick={props.handleClick} source="draw"/>
            )}
        </div>
    )
}
