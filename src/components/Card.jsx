import React, { Component } from 'react'
import './Card.css'
// todo card index
// is visible 
// value
export default class Card extends Component {
    constructor(props) {
        super(props);

        this.getClassName = this.getClassName.bind(this);
    }

    getClassName() {
        const { card } = this.props;
        if (card.faceDown) {
            return "card-facedown";
        } else {
            if (card.value < 0) {
                return "card-violet";
            } else if (card.value == 0) {
                return "card-blue";
            } else if (card.value < 5) {
                return "card-green";
            } else if (card.value < 9) {
                return "card-yellow";
            } else {
                return "card-red";
            }
        }
    }

    render() {
        const { card, cell } = this.props;
        return (
            <div className="card" onClick={() => this.props.handleClick({ source: "board", cell: cell })}>
                <div className={this.getClassName()} >
                    <div className="card-number">
                        {card.faceDown ?
                            "" :
                            card.value
                        }
                    </div>
                </div>
            </div>
        )
    }
}
