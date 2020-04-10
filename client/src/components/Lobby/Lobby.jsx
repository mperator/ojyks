import React, { Component, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import { UserContext } from '../../context/user-context'

// displays all users
// user that is creator of lobby can start
// if start was done lobby is closed everyone is notified to navigate to game
// chat must be saved to usércontext to keep over session
export default class Lobby extends Component {
    static contextType = UserContext;

    constructor(prop) {
        super(prop);

        this.state = {
            lobby: {
                // name: '',
                // creator: '',
                // slots: 0,
                // state: '',
                // users: []
            }
        }

        this.handleMessage = this.handleMessage.bind(this);
    }

    handleMessage(data) {
        if (data.type !== 'response' ||
            data.action !== 'update-lobby') return;

        console.log("lobby update", data);

        this.setState({ lobby: data.payload.lobby });
    }

    componentDidMount() {
        if (!this.context.username) return;

        this.context.registerCallback('lobbyMessageHandler', this.handleMessage);

        this.context.send({ type: 'request', action: 'update-lobby', payload: { lobbyname: this.props.match.params.name } });
    }

    componentWillUnmount() {
        this.context.unregisterCallback('lobbyMessageHandler');
    }

    render() {
        // TODO router guard
        if(!this.context.username) return (<Redirect to="/" />);

        return (
            <div>
                <h1>Lobby</h1>
                {this.context.username}

                Lobby name: {this.props.match.params.name}

                {this.state.lobby && <Fragment>
                    <div>
                        <p>{this.state.lobby.name}</p>
                        <p>{this.state.lobby.creator}</p>
                        {this.state.lobby.creator === this.context.username &&
                            <button>start</button>
                        }

Users in Lobby
                <ul>
                            {this.state.lobby.users && this.state.lobby.users.map((u, i) => (
                                <li key={i}>{u}</li>
                            ))}
                        </ul>
                    </div>
                </Fragment>}


            </div>
        )
    }
}
