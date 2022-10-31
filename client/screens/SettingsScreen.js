import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {RadioButton} from 'react-native-paper';
import axios from 'axios';

class SettingsScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            voice: "F", // I or F
        }
    }

    setVoice = (value) => {
        this.setState({voice: value});
        // console.log(value);

        axios({
            method: 'get',
            url: `${this.props.baseURL_HTTP}/setVoice?voice=${value}`,
        }).then((response) => {
            console.log(response.data);
        }).catch((error) => {
            this.setState({status: error});
        });
    }

    render = () => {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.category}>Choose your preferred option</Text>
                <RadioButton.Group onValueChange={newValue => this.props.setCallType(newValue)}
                                   value={this.props.callType}>
                    <RadioButton.Item label="Captions only" value="Caption" labelStyle={{color: 'white'}}/>
                    <RadioButton.Item label="Captions and type to talk" value="CaptionAndType"
                                      labelStyle={{color: 'white'}}/>
                </RadioButton.Group>
                <Text style={styles.category}>Voice</Text>
                <RadioButton.Group onValueChange={newValue => this.setVoice(newValue)} value={this.state.voice}>
                    <RadioButton.Item label="Male" value="I" labelStyle={{color: 'white'}}/>
                    <RadioButton.Item label="Female" value="F" labelStyle={{color: 'white'}}/>
                </RadioButton.Group>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#34343b',
        paddingTop: 50,
        paddingLeft: 20,
    },
    title: {
        fontSize: 30,
        color: 'white',
        marginBottom: 10,
    },
    category: {
        fontSize: 18,
        color: 'white',
        marginTop: 30,
    },
});

export default SettingsScreen;