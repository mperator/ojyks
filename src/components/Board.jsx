import React from 'react'

import Card from './Card'
import './Board.css'

export default function Board(props) {
    // click card tu turn, to swap
    return (
        <div className="board">
            {props.cards.map((card, i) => 
                <div className="board-card-place" key={i}>
                    {card && <Card card={card} cell={i} handleClick={props.handleClick}/>}
                </div>
            )}

            {/* <div className="board-card-place">1</div>
            <div className="board-card-place">2</div>
            <div className="board-card-place">3</div>
            <div className="board-card-place">4</div>
            <div className="board-card-place">5</div>
            <div className="board-card-place">6</div>
            <div className="board-card-place">7</div>
            <div className="board-card-place">8</div>
            <div className="board-card-place">9</div>
            <div className="board-card-place">9</div>
            <div className="board-card-place">9</div>
            <div className="board-card-place">9</div> */}
        </div>
        // <div className="board">
        //     {props.cards.map((card, i) => 
        //         card ? 
        //         <Card card={card} key={i} cell={i} handleClick={props.handleClick}/> : 
        //         <div>-</div>
        //     )}
        // </div>
    )
}
