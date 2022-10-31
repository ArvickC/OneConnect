import React from 'react'
import {GiftedChat} from 'react-native-gifted-chat'
import {Feather} from '@expo/vector-icons';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import axios from 'axios';

class ChatScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {messages: [], caller: ""}
        this.texts = {}
        this.id = 1;
        this.onCall = false;

        if (this.props.route.params) this.props.route.params.ws.addEventListener("message", this.handleWSMessage);

        this.props.navigation.addListener('focus', () => {
            console.log(this.props);
            this.onCall = this.props.route?.params?.onCall;
            if (this.onCall) {
                this.setState({caller: this.props.route.params.caller});
                this.setCallHandler();
            } else this.setState({caller: ""})
        })
    }

    endCallCleanUp = () => {
        this.onCall = false;
        this.props.route.params.onCall = false;
        this.setState({messages: [], caller: ""});
        this.texts = {};
        this.props.navigation.navigate("Dial");
    }

    handleWSMessage = (msg) => {
        const data = JSON.parse(msg.data);
        switch (data.event) {
            case "interim-transcription":
                this.onWSReceive(data);
                break;
            case "away-hangup":
                this.endCallCleanUp();
                break;
        }
    }


    onWSReceive = (data) => {
        let newMessage = false;
        if (Object.keys(this.texts).length === 0) newMessage = true;
        this.texts[data.audio_start] = data.text;
        const keys = Object.keys(this.texts);
        keys.sort((a, b) => a - b);
        let msg = '';
        for (const key of keys) {
            if (this.texts[key]) {
                msg += `${this.texts[key]}` + ' ';
                msg = msg.trim();
            }
        }
        console.log(msg);

        let newMessages = [...this.state.messages];
        if (newMessage) {
            newMessages.unshift({
                _id: this.id++,
                text: msg,
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: 'React Native',
                    avatar: 'https://facebook.github.io/react/img/logo_og.png',
                },
            });
        } else {
            if (newMessages.length > 0) {
                newMessages[0].text = msg;
            }
        }
        this.setState({messages: newMessages});
    }


    onSend = (messages) => {
        let newMessages = [...this.state.messages];
        this.setState({messages: GiftedChat.append(newMessages, messages)})
        this.texts = {}
        this.sendMessage(messages[0].text);
    }

    sendMessage = async (msg) => {
        axios({
            method: 'get',
            url: `${this.props.baseURL_HTTP}/sendmsg?msg=${msg}`,
        }).then((response) => {
            console.log(response.data);
        }).catch((error) => {
            console.log(error);
        });
    }

    endCall = () => {
        if (!this.props.route.params || !this.props.route.params.sid) {
            this.props.navigation.navigate("Dial");
            return;
        }

        if (this.props.route.params.call) {
            this.props.route.params.call.disconnect();
        } else {

            axios({
                method: 'get',
                url: `${this.props.baseURL_HTTP}/endcall?sid=${this.props.route.params.sid}`,
            }).then((response) => {
                console.log(response.data);
            }).catch((error) => {
                console.log(error);
            });
        }
        this.endCallCleanUp();
    }

    formatNumber(text) {
        var cleaned = ('' + text).replace(/\D/g, '')
        var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/)
        if (match) {
            var intlCode = (match[1] ? '+1 ' : ''),
                number = [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
            return number;
        }
        return number;
    }

    setCallHandler = () => {
        if (this.props.route.params && this.props.route.params.call) {
            this.props.route?.params?.call.on("disconnect", () => {
                console.log("Call disconnected");
                this.endCallCleanUp();
            });
            this.props.route?.params?.call.on("cancel", () => {
                console.log("Call cancelled");
                this.endCallCleanUp();
            });
        }
    }

    render = () => {
        return (
            <View style={styles.container}>
                {this.props.route.params ?
                    <Text style={styles.title}>{this.formatNumber(this.state.caller)}</Text> : null}
                <View style={styles.container}>
                    <GiftedChat
                        messages={this.state.messages}
                        onSend={messages => this.onSend(messages)}
                        user={{
                            _id: 1,
                            avatar: 'https://placeimg.com/140/140/any',
                        }}
                    />
                </View>
                {this.onCall ?
                    <TouchableOpacity style={styles.buttons} onPress={() => this.endCall()}><Feather name="phone-off"
                                                                                                     size={40}
                                                                                                     color="red"/></TouchableOpacity> : null
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#34343b',
    },
    title: {
        fontSize: 24,
        marginLeft: 50,
        marginTop: 70,
        justifyContent: 'center',
        color: 'white',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
    },
});

export default ChatScreen;