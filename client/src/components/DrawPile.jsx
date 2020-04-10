import React, { Fragment } from 'react'
import Card from './Card'
import './DrawPile.css'

export default function DrawPile(props) {
    return (
        <div className="draw-pile">
            {props.cards.length > 0 && (
                <Card card={props.cards[0]} cell={-1} handleClick={props.handleClick} source={"draw"}/>
            )}
        </div>
    )
}
