import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

Card.propTypes = {
    card: PropTypes.object.isRequired,
    cell: PropTypes.number.isRequired,
    source: PropTypes.string.isRequired,
    handleClick: PropTypes.func
};

export default function Card({card, cell, source, handleClick}) {
    return (
        <div className="card2" onClick={() => handleClick && handleClick({ source: source, cell: cell })}>
            <div className={getClassName(card)} >
                <div className="card-number">
                    {card.faceDown ?
                        "" :
                        card.value
                    }
                </div>
            </div>
        </div>
    );
}

function getClassName(card) {
    if (card.faceDown) {
        return "card-facedown";
    } else {
        if (card.value < 0) {
            return "card-violet";
        } else if (card.value === 0) {
            return "card-blue";
        } else if (card.value < 5) {
            return "card-green";
        } else if (card.value < 9) {
            return "card-yellow";
        }
        return "card-red";
    }
}
