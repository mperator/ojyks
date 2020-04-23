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
        <div className={getCardClassName(card)} onClick={() => handleClick && handleClick({ source, cardIndex })}>
            <div className='face back' />
            <div className={getFrontClassName(card)}>
                <span>{card.value}</span>
            </div>
        </div>
    );
}

function getFrontClassName(card) {
    if (card.faceDown) {
        return 'face front';
    }
    return `face front card-${getColor(card.value)}`;
}

function getCardClassName(card) {
    if (card.faceDown) {
        return 'card-wrapper';
    }
    return 'card-wrapper card-flipped';
}

function getColor(value) {
    if (value < 0) {
        return 'purple';
    } else if (value == 0) {
        return 'blue';
    } else if (value <= 4) {
        return 'green';
    } else if (value <= 8) {
        return 'yellow';
    }
    return 'red';
}
