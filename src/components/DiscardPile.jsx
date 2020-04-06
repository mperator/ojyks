import React, { Fragment } from 'react'

export default function DiscardPile(props) {
    return (
        <div>
            <p>{props.cards.length}</p>
            {props.cards.length > 0 && (
                <Fragment>
                    <p>{props.cards[0].value}</p>
                    <p>{props.cards[0].id}</p>
                    <p>{props.cards[0].faceDown.toString()}</p>
                </Fragment>
            )}
        </div>
    )
}
