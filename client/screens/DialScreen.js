import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {AntDesign, Feather} from "@expo/vector-icons";
import axios from 'axios';

class DialScreen extends React.Component {
    constructor(props) {
        super(props);
        this.sid = null;
        this.phoneNum = "";
        this.state = {
            number: "",
        }
    }

    onPress = (n) => {
        if (n == '-1')
            this.setState({number: this.state.number.substring(0, this.state.number.length - 1)});
        else if (this.state.number.length < 15)
            this.setState({number: this.state.number + n});
    }

    makeCall = () => {
        if (this.props.callType === "Caption") {
            this.makeOutgoingCallStream();
        } else {
            this.makeOutgoingCallConnect();
        }
    }

    makeOutgoingCallConnect = () => { // Caption and typing
        axios({
            method: 'get',
            url: `${this.props.baseURL_HTTP}/call?to=${this.state.number}`,
        }).then((response) => {
            this.sid = response.data;
            let no = this.state.number;
            this.setState({number: ""});
            this.props.navigation.navigate("Chat", {caller: no, ws: this.props.ws, sid: this.sid, onCall: true});
        }).catch((error) => {
            this.setState({status: error});
        });
    }

    makeOutgoingCallStream = async () => { // Caption only, no typing
        var params = {
            To: this.state.number,
        };

        if (this.props.device) {
            console.log(`Attempting to call ${params.To} ...`);
            let call = await this.props.device.connect({params});

            // "accepted" means the call has finished connecting and the state is now "open"
            call.on("accept", () => {
                console.log("Call accepted");
                console.log(call.parameters.CallSid);
                let no = this.state.number;
                this.sid = call.parameters.CallSid;
                this.setState({number: ""});
                this.props.navigation.navigate("Chat", {
                    caller: no,
                    ws: this.props.ws,
                    sid: call.parameters.CallSid,
                    call: call,
                    onCall: true
                });
            });
            call.on("disconnect", () => {
                console.log("Call disconnected")
            });
            call.on("cancel", () => {
                console.log("Call canceled")
            });
        } else {
            console.log("Unable to make call.");
        }
    }


    formatPhoneNumber = (text) => {
        console.log(text);
        if (!text) return text

        let cleaned = text.replace(/\D/g, '') // remove non-digit characters
        let match = null

        if (cleaned.length >= 0 && cleaned.length <= 2) {
            return `(${cleaned}`
        } else if (cleaned.length == 3) {
            return `(${cleaned}) `
        } else if (cleaned.length > 3 && cleaned.length <= 5) {
            match = cleaned.match(/(\d{3})(\d{1,3})$/)
            if (match) {
                return `(${match[1]}) ${match[2]}`
            }
        } else if (cleaned.length == 6) {
            match = cleaned.match(/(\d{3})(\d{3})$/)
            if (match) {
                return `(${match[1]}) ${match[2]}-`
            }
        } else if (cleaned.length > 6) {
            match = cleaned.match(/(\d{3})(\d{3})(\d{1,4})$/)
            if (match) {
                return `(${match[1]}) ${match[2]}-${match[3]}`
            }
        }

        return text
    }

    render = () => {
        this.phoneNum = this.formatPhoneNumber(this.state.number);
        return (
            <View style={styles.container}>
                <View style={styles.number}><Text style={styles.numberStyle}>{this.phoneNum}</Text></View>

                <View style={styles.dial}>

                    <View style={styles.dialRow}>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('1')}><Text
                            style={styles.numberStyle}>1</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('2')}><Text
                            style={styles.numberStyle}>2</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('3')}><Text
                            style={styles.numberStyle}>3</Text></TouchableOpacity>
                    </View>

                    <View style={styles.dialRow}>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('4')}><Text
                            style={styles.numberStyle}>4</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('5')}><Text
                            style={styles.numberStyle}>5</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('6')}><Text
                            style={styles.numberStyle}>6</Text></TouchableOpacity>
                    </View>

                    <View style={styles.dialRow}>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('7')}><Text
                            style={styles.numberStyle}>7</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('8')}><Text
                            style={styles.numberStyle}>8</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('9')}><Text
                            style={styles.numberStyle}>9</Text></TouchableOpacity>
                    </View>

                    <View style={styles.dialRow}>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('+')}><Text
                            style={styles.numberStyle}>+</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('0')}><Text
                            style={styles.numberStyle}>0</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.dialNumber} onPress={() => this.onPress('-1')}><AntDesign
                            name="left" size={35} color="white"/></TouchableOpacity>
                    </View>

                    <View style={styles.dialRow}>
                        <View style={styles.spacer}></View>
                        <TouchableOpacity style={styles.callButton} onPress={this.makeCall}><Feather name="phone"
                                                                                                     size={40}
                                                                                                     color="#66ff66"/></TouchableOpacity>
                        <View style={styles.spacer}></View>
                    </View>
                </View>

            </View>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        justifyContent: "center"
    },
    number: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#34343b",
    },
    dialRow: {
        flex: 1,
        flexDirection: "row",
    },
    dial: {
        flex: 1.5,
        backgroundColor: '#1f1f24',
    },
    dialNumber: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        margin: 5
    },
    spacer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        margin: 5
    },
    numberStyle: {
        fontSize: 40,
        color: 'white',
    },
    callButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        margin: 5
    }
});

export default DialScreen;