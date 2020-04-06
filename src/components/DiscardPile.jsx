import React from 'react'

export default function DiscardPile(props) {
    return (
        <div>
            <p>{props.cards.length}</p>
            <p>{props.cards.length > 0 &&
            props.cards[0]}</p>
        </div>
    )
}
