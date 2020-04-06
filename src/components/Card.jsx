import React, { Component } from 'react'

// todo card index
// is visible 
// value
export default class Card extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        console.log(this.props)
        return (
            <div>
                {this.props.card}
            </div>
        )
    }
}
