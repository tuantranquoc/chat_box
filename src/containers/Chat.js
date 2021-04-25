import React from 'react';
import { useEffect, useState, useRef } from 'react';
import SidePanel from './side_panel/SidePanel';
import { backendLookup } from '../Lookup'

export default function Chat() {
    const [newMessage, setMessage] = useState(null);
    const [messageObject, setMessageObject] = useState(null);
    const [messageList, setMessageList] = useState([]);
    const [isLookup, setLookup] = useState(false);
    const [currentUser, setUser] = useState();
    const [firstWS, setFirstWS] = useState(false);
    const [wsConnect, setWSConnect] = useState(false);
    const [wsSignalConnect, setWSSignalConnect] = useState(false);
    const [signalRoom, setSignalRoom] = useState();
    const ws = useRef(null);
    const ws_signal = useRef(null);

    const newMessageHandler = event => {
        if (newMessage !== null) {
            setMessage(null);
        }
        event.preventDefault();
        setMessage(event.target.value);
    };

    const handleBackendUpDate = (response, status) => {

        if (status === 200) {
            setLookup(true);
            localStorage.setItem('token', response.access);
            backendLookup("POST", "/profile/", {}, handleLogin, true);
            backendLookup("GET", "/notification/signal/room", {}, handleSignalRoom, true);
        }
    };

    const handleLogin = (response, status) => {
        if (status === 200) {
            setUser(response.results[0].username);
        }
    };

    const handleSignalRoom = (response, status) => {
        console.log("from sig",response)
        if (status === 200) {
            if (response.results){
                setSignalRoom(response.results[0].id);
            }
        }
    };

    var data = {
        "username": "admin",
        "password": "password"
    }

    const endpoint = "/token/";

    useEffect(() => {
        if (isLookup === false) {
            backendLookup("POST", endpoint, data, handleBackendUpDate);
        }
    })



    useEffect(() => {
        console.log(isLookup)
        if (isLookup === true) {
            ws.current = new WebSocket("ws://127.0.0.1:8000/ws/chat/9/");
            ws.current.onopen = () => {
                console.log("ws opened")
                setWSConnect(true);
            };
            ws.current.onclose = () => console.log("ws closed");
            return () => {
                ws.current.close();
            };
        }
    }, [isLookup]);

    useEffect(() => {
        console.log("islookup in signal", isLookup)
        console.log("signalroom", signalRoom)
        if (isLookup === true) {
            var url = "ws://127.0.0.1:8000/ws/signal/";
            if (signalRoom){
                console.log("signalroom", signalRoom)
                url += signalRoom + "/"
                console.log(url)
                // ws_signal.current = new WebSocket("ws://127.0.0.1:8000/ws/signal/9/");
                ws_signal.current = new WebSocket(url);
                ws_signal.current.onopen = () => {
                    console.log("ws_signal opened")
                    setWSSignalConnect(true);
                };
                ws_signal.current.onclose = () => console.log("ws closed");
                return () => {
                    ws_signal.current.close();
                };
            }
        }
    }, [isLookup, signalRoom])

    useEffect(() =>{
        if (isLookup === true){
            if (!ws_signal.current) return;
            ws_signal.current.onmessage = e => {
                const message = JSON.parse(e.data);
                if (message.message !== undefined) {
                    console.log("response from signal", message)
                }
            };
        }
        if (wsSignalConnect === true) {
            var Object = {
                "from": currentUser,
                "command": 'on_connect',
                "token": localStorage.getItem("token")
            }
            ws_signal.current.send(JSON.stringify(Object));
            setWSSignalConnect(false);
        }
    }, [isLookup, wsSignalConnect])



    useEffect(() => {
        if (isLookup === true) {
            if (!ws.current) return;
            // console.log("mess-obj", messageObject)
            if (messageObject !== null) {
                console.log("mess-obj", messageObject)
                ws.current.send(JSON.stringify(messageObject));
                setMessageObject(null);
            }
            ws.current.onmessage = e => {
                const message = JSON.parse(e.data);
                if (message.messages !== undefined) {
                    console.log("new_message", message)
                    setMessageList(message.messages);
                }
                if (message.command !== undefined) {
                    if (message.command === "new_message") {
                        var Object = {
                            "author": message.message.author,
                            "content": message.message.content,
                        }
                        setMessageList(messageList => [...messageList, Object]);
                    }
                }
            };
        }
        if (wsConnect === true) {
            var Object = {
                "from": currentUser,
                "command": 'on_connect',
                "token": localStorage.getItem("token")
            }
            ws.current.send(JSON.stringify(Object));
            print("hello world")
            setWSConnect(false)
        }
    }, [isLookup, messageObject, wsConnect]);

    const submitMessage = () => {
        const messageInput = document.getElementById("chat-message-input");
        messageInput.value = "";
        if (newMessage !== null) {
            if (currentUser != undefined) {
                var Object = {
                    "from": currentUser,
                    "message": newMessage,
                    "command": 'new_message',
                    "token": localStorage.getItem("token")
                }
                setMessageObject(Object);
            }
        }
    };

    var renderMessage = (message, author) => {
        var className = author === currentUser ? "replies" : "sent";
        return (
            className ?
                <div>
                    <li className={className}>
                        <img src="http://emilcarlsson.se/assets/mikeross.png" alt="" />
                        <p>
                            {message}
                        </p>
                    </li>
                </div> : <div>
                    <li className="sent">
                        <img src="http://emilcarlsson.se/assets/mikeross.png" alt="" />
                        <p>
                        </p>
                    </li>
                </div>
        )

    }
    return (
        <div id="frame">
            {/* <AppWs parentCallback={callback} messageObject={messageObject !== undefined ? messageObject : "hello world"} /> */}
            <SidePanel />
            <div className="content">
                <div className="contact-profile">
                    <img src="http://emilcarlsson.se/assets/harveyspecter.png" alt="" />

                    <div className="social-media">
                        <i className="fa fa-facebook" aria-hidden="true"></i>
                        <i className="fa fa-twitter" aria-hidden="true"></i>
                        <i className="fa fa-instagram" aria-hidden="true"></i>
                    </div>
                </div>
                <div className="messages">
                    <ul id="chat-log">
                        {messageList !== undefined ? messageList.map(message => renderMessage(message.content, message.author)) : null}
                    </ul>
                </div>
                <div className="message-input">
                    <div className="wrap">
                        <input onChange={newMessageHandler} id="chat-message-input" type="text" placeholder="Write your message..." />
                        <i className="fa fa-paperclip attachment" aria-hidden="true"></i>
                        <button onClick={submitMessage} id="chat-message-submit" className="submit"><i className="fa fa-paper-plane"
                            aria-hidden="true"></i></button>
                    </div>
                </div>
            </div>
        </div>
    )
}

