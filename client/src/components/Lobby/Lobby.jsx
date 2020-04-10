import React, { Component } from 'react'
import { UserContext } from '../../context/user-context'

export default class Lobby extends Component {
    static contextType = UserContext;

    render() {
        return (
            <div>
                <h1>Lobby</h1>
                {this.context.username}
            </div>
        )
    }
}
