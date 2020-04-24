import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

Card.propTypes = {
    card: PropTypes.object.isRequired,
    cardIndex: PropTypes.number.isRequired,
    source: PropTypes.string.isRequired,
    handleClick: PropTypes.func,
    small: PropTypes.bool
};

export default function Card({ card, cardIndex, source, handleClick, small }) {
    return (
        <div className={getCardClassName(card, small)} onClick={() => handleClick && handleClick({ source, cardIndex })}>
            <div className={getBackClassName(card, small)} />
            <div className={getFrontClassName(card, small)}>
                <span>{card.value}</span>
            </div>
        </div>
    );
}

function getFrontClassName(card, small) {
    let className = 'face front';
    if (!card.faceDown) {
        className += ` card-${getColor(card.value)}`;
    }
    if (small) {
        className += ' small';
    }
    return className;
}

function getBackClassName(card, small) {
    let className = 'face back';
    if (small) {
        className += ' small';
    }
    return className;
}

function getCardClassName(card, small) {
    let className = 'card-wrapper';
    if (!card.faceDown) {
        className += ' card-flipped';
    }
    if (small) {
        className += ' small';
    }
    return className;
}

function getColor(value) {
    if (value < 0) {
        return 'purple';
    } else if (value === 0) {
        return 'blue';
    } else if (value <= 4) {
        return 'green';
    } else if (value <= 8) {
        return 'yellow';
    }
    return 'red';
}
