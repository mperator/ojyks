import React from 'react'
import Card from './Card'
import CardPlaceholder from './CardPlaceholder';
import locals from './DiscardPile.module.css';

export default function DiscardPile(props) {
    const selected = props.state === "discard";
    return (
        <div className={locals.stackContainer} onClick={props.cards.length === 0 ? () => props.handleClick({source: "discard"}) : () => {}}>
            {props.cards.length > 0 && (
                <div className={locals.stackItem}>
                    <Card card={props.cards[0]} cardIndex={-1} handleClick={props.handleClick} source="discard" selected={selected}/>
                </div>
            )}
            <div className={locals.stackItem}>
                <CardPlaceholder className={locals.stackItem} />
            </div>
        </div>
    )
}
