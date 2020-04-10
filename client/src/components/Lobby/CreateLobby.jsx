import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'

export default class CreateLobby extends Component {
    render() {
        return (
            <div>
                <h1>create</h1>
                <input type="text" name="roomname" id="roomname" value="" />

                <button>
                    <NavLink to="/lobby">create</NavLink>
                </button>
            </div>
        )
    }
}
