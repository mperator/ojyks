import React, { Fragment } from 'react'

export default function DiscardPile(props) {
    return (
        <div onClick={() => props.handleClick({ source: "discard"})}>
            {/* <p>{props.cards.length}</p> */}
            {props.cards.length > 0 && (
                <Fragment>
                    {props.cards[0].faceDown ?
                        <p>#</p>    :
                        <p>{props.cards[0].value}</p>
                    }
                    {/* <p>{props.cards[0].value}</p>
                    <p>{props.cards[0].id}</p>
                    <p>{props.cards[0].faceDown.toString()}</p> */}
                </Fragment>
            )}
        </div>
    )
}