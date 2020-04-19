import React from 'react'
import Card from './Card'
import './DiscardPile.css'

export default function DiscardPile(props) {
    return (
        // only activate function on discard pile if no card exists
        <div className="discard-pile" onClick={props.cards.length === 0 ? () => props.handleClick({source: "discard"}) : () => {}}>
            {props.cards.length > 0 && (
                <Card card={props.cards[0]} cell={-1} handleClick={props.handleClick} source={"discard"}/>
            )}
        </div>
    )
}
