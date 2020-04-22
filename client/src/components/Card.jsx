import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

Card.propTypes = {
    card: PropTypes.object.isRequired,
    cardIndex: PropTypes.number.isRequired,
    source: PropTypes.string.isRequired,
    handleClick: PropTypes.func
};

export default function Card({card, cardIndex, source, handleClick}) {
    return (
        <div class={getCardClassName(card)} onClick={() => handleClick && handleClick({ source, cardIndex })}>
            <div class='face back' />
            <div class={getFrontClassName(card)} />
        </div>
    );
}

function getFrontClassName(card) {
    if (card.faceDown) {
        return 'face front';
    }
    return `face front card${card.value}`;
}

function getCardClassName(card) {
    if (card.faceDown) {
        return 'cardWrapper';
    }
    return 'cardWrapper card-flipped';
}
