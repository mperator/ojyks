import React, { Component } from 'react'

import { UserContext } from '../../context/user-context'
import { Redirect } from 'react-router-dom';

export default class Login extends Component {
    static contextType = UserContext;

    constructor(props) {
        super(props);

        this.state = {
            username: "",
            errorMessage: ""
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value,
            errorMessage: ""
        });
    }

    handleClick(e) {
        e.preventDefault();

        if (this.state.username) {
            this.context.setUsername(this.state.username);
            this.props.history.push("/lobby/join");
        } else {
            this.setState({ errorMessage: "Fehler: Kein Benutzername angegeben..." });
        }
    }

    componentDidMount() {
        this.setState({ username: this.context.username});
    }

    render() {
        // automatically push to lobby overview if user exists
        //if (this.context.username) return (<Redirect to="/lobby/join" />);

        return (
            <div className="login container">
                <div className="row">
                    <div className="col s12">
                        <h1>Login</h1>
                        <p className="flow-text">
                            Geb einen Namen ein um in eine Lobby beizutreten oder eine Lobby zu erstellen.
                        </p>
                    </div>
                    <div className="input-field col s12">
                        <input type="text" name="username" id="username" value={this.state.username} onChange={this.handleChange} disabled={this.context.uuid}/>
                        <label htmlFor="username">Benutzername:</label>
                    </div>

                    <div className="input-field col s12">
                        <button className="btn right ml5" name="login" onClick={this.handleClick}>login</button>
                    </div>

                    <div className="col s12 left red-text">
                        {this.state.errorMessage ? <p>{this.state.errorMessage}</p> : null}
                    </div>
                </div>
            </div>
        )
    }
}
