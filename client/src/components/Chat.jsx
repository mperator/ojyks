import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Chat extends Component {
    handleSend = (e) => {
        e.preventDefault();
        const { context, lobby } = this.props;
        const message = this.messageInput.value.trim();

        if (isBlank(message)) {
            return;
        }

        const payload = {
            player: context.username,
            lobby,
            message
        };
        context.send({ type: 'request', action: 'lobby-message', payload });
        context.addMessage(payload);
        this.messageInput.value = '';
    }

    render() {
        const { context } = this.props;
        return (
            <>
                <div className="input-field">
                    <input 
                        type="text"
                        name="messageInput"
                        id="messageInput"
                        ref={el => this.messageInput = el}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                this.handleSend(e);
                            }
                        }}
                    />
                    <label htmlFor="messageInput">Nachricht:</label>
                    <button className="btn" onClick={this.handleSend}>Senden</button>
                </div>
    
                <ul>
                    {context.chat.map((m, i) => (
                        <li key={i}>{m.player}: {m.message}</li>
                    ))}
                </ul>
            </>
        );
    }
}

Chat.propTypes = {
    context: PropTypes.object.isRequired,
    lobby: PropTypes.string.isRequired
};

function isBlank(str) {
    return !str || str.length === 0 || str.trim().length === 0;
}
