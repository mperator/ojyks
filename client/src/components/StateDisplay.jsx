import React from 'react';

import locals from './StateDisplay.module.css';

export default function StateDisplay({state}) {
    return (
        <p className={locals.text}>{toReadableText(state)}</p>
    );
}

function toReadableText(state) {
    switch (state.state) {
        case 'init':
            return 'Please flip 2 cards to start!';
        case 'play':
        case 'draw':
        case 'draw.open':
        case 'discard':
            if (hasAnyPlayerFinished(state)) {
                return 'It is your LAST turn!';
            }
            return 'It is your turn!';
        case 'ready':
            const otherPlayer = getActivePlayer(state);
            if (otherPlayer) {
                return `It is ${otherPlayer.name}'s turn.`;
            }
            return 'Waiting for other players...';
        case 'end':
            return 'Wating for the others to finish...';
        case 'score':
            return 'The game has finished.';
        default:
            return '';
    }        
}

function hasAnyPlayerFinished(state) {
    return state.players.some(p => p.state === 'end');
}

function getActivePlayer(state) {
    return state.players.find(p => 
        p.state === 'play' ||
        p.state === 'draw' ||
        p.state === 'draw.open' ||
        p.state === 'discard');
}
