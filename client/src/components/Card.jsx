import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

Card.propTypes = {
    card: PropTypes.object.isRequired,
    cardIndex: PropTypes.number.isRequired,
    source: PropTypes.string.isRequired,
    handleClick: PropTypes.func,
    small: PropTypes.bool,
    selected: PropTypes.bool
};

export default function Card({ card, cardIndex, source, handleClick, small, selected }) {
    return (
        <div className={getCardClassName(card, small, selected)} onClick={() => handleClick && handleClick({ source, cardIndex })}>
            <div className={getBackClassName(card, small)} />
            <div className={getFrontClassName(card, small)}>
                {!card.faceDown &&
                    <span>{card.value}</span>
                }
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

function getCardClassName(card, small, selected) {
    let className = 'card-wrapper';
    if (!card.faceDown) {
        className += ' card-flipped';
    }
    if(selected) {
        className += ' card-selected'
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
