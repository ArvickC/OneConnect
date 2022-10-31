import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Feather, MaterialCommunityIcons} from "@expo/vector-icons";
import {Ionicons} from '@expo/vector-icons';


import DialScreen from '../screens/DialScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

class HomeSreen extends React.Component {
    constructor(props) {
        super(props);
        this.ws = props.ws;
        this.ws.addEventListener("message", this.handleWSMessage);
        if (props.device) props.device.on("incoming", this.handleIncomingCall);
    }

    handleIncomingCall = (call) => {
        console.log(`Incoming call from ${call.parameters.From}`);
        this.props.navigation.navigate('IncomingCall', {
            caller: call.parameters.From,
            sid: call.parameters.CallSid,
            call: call
        });
    }

    handleWSMessage = (msg) => {
        let data = JSON.parse(msg.data);
        switch (data.event) {
            case "incoming_call":
                this.props.navigation.navigate("IncomingCall", {caller: data.From, sid: data.CallSid});
                break;
            default:
                break;
        }
    }

    render = () => {
        return (
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#fff',
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: {
                        backgroundColor: '#2a2a30',
                        borderTopWidth: 0,
                        borderTopColor: "transparent",
                    }
                }}
            >
                <Tab.Screen
                    name="Dial"
                    children={(props) => <DialScreen baseURL_HTTP={this.props.baseURL_HTTP} device={this.props.device}
                                                     ws={this.ws} callType={this.props.callType} {...props} />}
                    options={{
                        tabBarIcon: ({color}) => <MaterialCommunityIcons name="dialpad" size={20} color={color}/>
                    }}/>
                <Tab.Screen
                    name="Chat"
                    children={(props) => <ChatScreen baseURL_HTTP={this.props.baseURL_HTTP} ws={this.ws} {...props} />}
                    options={{
                        tabBarIcon: ({color}) => <Ionicons name="ios-chatbubble-outline" size={20} color={color}/>
                    }}/>
                <Tab.Screen
                    name="Calls"
                    children={(props) => <DialScreen baseURL_HTTP={this.props.baseURL_HTTP} ws={this.ws} {...props} />}
                    options={{tabBarIcon: ({color}) => <Feather name="list" size={20} color={color}/>}}/>
                <Tab.Screen
                    name="Settings"
                    children={(props) => <SettingsScreen ws={this.ws} baseURL_HTTP={this.props.baseURL_HTTP}
                                                         setCallType={this.props.setCallType}
                                                         callType={this.props.callType} {...props} />}
                    options={{tabBarIcon: ({color}) => <Feather name="settings" size={20} color={color}/>}}/>
            </Tab.Navigator>
        );
    }
}

export default HomeSreen;