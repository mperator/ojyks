import React, { Fragment } from 'react'
import Card from './Card'
import './DiscardPile.css'

export default function DiscardPile(props) {
    return (
        <div className="discard-pile" onClick={() => props.handleClick({source: "discard"})}>
            {props.cards.length > 0 && (
                <Card card={props.cards[0]} cell={-1} handleClick={() => props.handleClick({source: "discard"})}/>
            )}
        </div>
    )
}
