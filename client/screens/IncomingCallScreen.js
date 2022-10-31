import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {Feather} from '@expo/vector-icons';
import axios from 'axios';

const Tab = createBottomTabNavigator();

class IncomingCallScreen extends React.Component {
    constructor(props) {
        super(props);
    }

    acceptCall = () => {
        if (this.props.route.params.call) {
            this.props.route.params.call.accept();
            this.props.navigation.navigate("Chat", {
                caller: this.props.caller,
                ws: this.props.ws,
                sid: this.props.route.params.sid,
                call: this.props.route.params.call,
                onCall: true
            });
        } else {
            this.props.navigation.navigate("Chat", {
                caller: this.props.caller,
                ws: this.props.ws,
                sid: this.props.route.params.sid,
                onCall: true
            })
        }
    }

    declineCall = () => {
        if (this.props.route.params.call) {
            this.props.route.params.call.reject();
        } else {
            axios({
                method: 'get',
                url: `${this.props.baseURL_HTTP}/endcall?sid=${this.props.route.params.sid}`,
            }).then((response) => {
                this.token = response.data.token;
                console.log(this.token);
            }).catch((error) => {
                this.setState({status: error});
            });
        }
        this.props.navigation.navigate("Home");
    }

    render = () => {
        return (
            <View style={styles.container}>
                <View style={styles.callerId}>
                    <Text style={styles.headerText}>{this.props.route.params.caller}</Text>
                    <Text style={styles.subText}>Incoming Call...</Text>
                </View>

                <View style={styles.buttons}>
                    <TouchableOpacity onPress={this.acceptCall}><Feather name="phone" size={70} color="green"
                                                                         style={styles.buttonStyle}/></TouchableOpacity>
                    <TouchableOpacity onPress={this.declineCall}><Feather name="phone-off" size={70} color="red"
                                                                          style={styles.buttonStyle}/></TouchableOpacity>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#34343b'
    },
    callerId: {
        flex: 3,
    },
    buttons: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 50,
        color: 'white',
        marginLeft: 70,
        marginTop: 70,
    },
    subText: {
        fontSize: 15,
        color: 'white',
        marginLeft: 70,
        marginTop: 10,
    },
    buttonStyle: {
        margin: 40,
    }
});

export default IncomingCallScreen;