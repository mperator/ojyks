import React from 'react'

import Card from './Card'
import locals from './CardDeck.module.css'

export default function CardDeck(props) {
    return (
        <div className={locals.container}>
            <div className={locals.cardDeck}>
                {props.cards.map((card, i) => 
                    <div key={i}>
                        {card && 
                            <Card card={card} cardIndex={i} handleClick={props.handleClick} source="board" small={props.small} />
                        }
                    </div>
                )}
            </div>
        </div>
    )
}
