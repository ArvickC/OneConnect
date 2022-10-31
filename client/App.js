import {StyleSheet} from 'react-native';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import axios from 'axios';
import {LogBox} from 'react-native';

import HomeScreen from './screens/HomeScreen';
import IncomingCallScreen from './screens/IncomingCallScreen';

const Stack = createStackNavigator();
const baseURL = "ws://localhost:3000";
const baseURL_HTTP = "http://localhost:3000";
const names = ["alice"];
const index = Math.floor(Math.random() * names.length);

LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs();

class App extends React.Component {
    constructor(props) {
        super(props);
        this.token = "";
        this.identity = names[index];
        this.ws = new WebSocket(baseURL);
        this.state = {
            scriptAdded: false,
            callType: "CaptionAndType", // CaptionAndType, Caption
            device: null,
        };
    }

    addTwilioScript = () => {
        var se = document.createElement('script');
        se.type = 'text/javascript';
        se.async = true;
        se.src = `${baseURL_HTTP}/twilio.min.js`;
        document.body.appendChild(se);
    }

    fetchAccessToken = async () => {
        axios({
            method: 'get',
            url: `${baseURL_HTTP}/token?id=${this.identity}`,
        }).then((response) => {
            this.token = response.data.token;
            console.log(this.token);
        }).catch((error) => {
            this.setState({status: error});
        });
    }

    initializeDevice = () => {
        console.log("validating")
        this.setState({device: new Twilio.Device(this.token)});
        this.state.device.disconnectAll();
        this.state.device.removeAllListeners();
        this.addDeviceListeners();
        this.state.device.register();
        console.log("registering")
    }

    addDeviceListeners = () => {
        this.state.device.on('registered', function () {
            console.log("Twilio.Device Ready!");
        });

        this.state.device.on("error", function (error) {
            console.log("Twilio.Device Error: " + error.message);
        });
    }

    setCallType = (value) => {
        this.setState({callType: value});
        axios({
            method: 'get',
            url: `${baseURL_HTTP}/setCallType?callType=${value}`,
        }).then((response) => {
            console.log(response.data);
        }).catch((error) => {
            this.setState({status: error});
        });

        if (value === "Caption" && !this.state.scriptAdded) {
            this.addTwilioScript();
            this.fetchAccessToken();
            setTimeout(() => {
                this.initializeDevice();
                this.setState({scriptAdded: true});
                this.render()
            }, 3000);
        }
    }

    render = () => {
        return (
            <NavigationContainer>
                <Stack.Navigator screenOptions={{headerShown: false}}>
                    <Stack.Screen name="Home" children={(props) => <HomeScreen baseURL_HTTP={baseURL_HTTP}
                                                                               device={this.state.device} ws={this.ws}
                                                                               setCallType={this.setCallType}
                                                                               callType={this.state.callType} {...props} />}/>
                    <Stack.Screen name="IncomingCall"
                                  children={(props) => <IncomingCallScreen device={this.state.device} ws={this.ws}
                                                                           baseURL_HTTP={baseURL_HTTP} {...props} />}/>
                </Stack.Navigator>
            </NavigationContainer>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default App;
