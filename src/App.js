import React, {Component} from 'react';
import 'webrtc-adapter';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {deepOrange500} from 'material-ui/styles/colors';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

import './App.css';

injectTapEventPlugin();

const muiTheme = getMuiTheme({
  palette: {
    accent1Color: deepOrange500,
  },
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stage: 0,
      roomName: 'HelloRoom',
      error_msg: 'none error',
      modal_open: false,
      localStream: null,
      roomStreams: {}
    };
  }

  componentDidMount() {
    (async function () {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log(this);
        this.setState({
          localStream,
          stage: 1
        });
      } catch (error) {
        console.log(error);
        this.setState({
          modal_open: true
        });
      }
    }.bind(this))();

  }

  componentDidUpdate(prevProps, prevState){
    console.log('componentDidUpdate');
    const that = this;
    if(prevState.stage === 1 && this.state.stage === 2){
      console.log("init");
      const peer = new window.Peer({
        key: 'aae74d8e-0f04-4722-8e4e-0d0f859fb414',
        debug: 0
      });
      peer.on('error', function (err) {
        console.log('peerjs error', err);
      });
      peer.on('open', function () {
        console.log('peerjs open');
        const sfuRoom = peer.joinRoom(
          that.state.roomName,
          {mode: 'sfu', stream: that.state.localStream}
        );
        sfuRoom.on('open', () => {
          console.log('room open');
        });
        sfuRoom.on('stream', (peerStream) => {
          console.log('room stream', peerStream);
          let streams = {
            ...that.state.roomStreams,
            [peerStream.peerId]: peerStream
          };
          that.setState({
            roomStreams: streams
          });
        });
        sfuRoom.on('removeStream', (peerStream) => {
          console.log('room removeStream', peerStream);
          let streams = {
            ...that.state.roomStreams,
          };
          delete streams[peerStream.peerId];
          that.setState({
            roomStreams: streams
          });
        });
        sfuRoom.on('peerJoin', (peerId) => {
          console.log('room peerJoin', peerId);
        });
        sfuRoom.on('peerLeave', (peerId) => {
          console.log('room peerLeave', peerId);
        });
        sfuRoom.on('data', (dataMessage) => {
          console.log('room data', dataMessage);
        });
        sfuRoom.on('log', (logs) => {
          console.log('room log', logs);
        });
        sfuRoom.on('close', () => {
          console.log('room close');
        });
        sfuRoom.on('error', (err) => {
          console.error('room error', err);
        });
      });
    }

  }
  componentWillUnmount() {
    console.log('componentWillUnmount');
  }
  handleClose = () => {
    this.setState({
      modal_open: false
    });
  };

  handleChange(e) {
    this.setState({
      roomName: e.target.value,
    });
  };

  enterClick(){
    this.setState({
      stage: 2,
    });
  }

  render() {
    console.log("render", this.state);
    const {modal_open} = this.state;
    const actions = [
      <FlatButton
        label="Discard"
        primary={true}
        onTouchTap={this.handleClose}
      />
    ];
    const remoteVideoDom = Object.keys(this.state.roomStreams).map(
      (peerId) => {
        /*
        古い書き
        const remoteVideoUrl = window.URL.createObjectURL(this.state.roomStreams[peerId]);
        let videoElm = (
          <video
            key={peerId}
            src={remoteVideoUrl}
            style={{width: "200px"}}
            autoPlay
          />
        );
        */
        const addRemoteVideo = (videoElm) => {
          // 更新前のvideoElmのnullが渡ってくるので必要
          if(videoElm){
            videoElm.srcObject = this.state.roomStreams[peerId]
          }
        };
        let videoElm = (
            <video
              key={peerId}
              ref={(videoElm) => {addRemoteVideo(videoElm)}}
              style={{height: "200px", padding: "3px"}}
              autoPlay
            />
        );
        return videoElm;
      }
    );

    const contents = () => {
      switch (this.state.stage){
        case 0:
          break;
        case 1:
          return (
            <div>
              <TextField
                value={this.state.roomName}
                onChange={e => this.handleChange(e)}
                hintText="Room Name"
                fullWidth={true}
              />
              <RaisedButton
                label="Enter Room"
                primary={true}
                fullWidth={true}
                onClick={e => this.enterClick(e)}
              />
            </div>
          );
          break;
        case 2:
          return (
            <div>
              <video
                ref={(myVideo) => {if(myVideo){ myVideo.srcObject = this.state.localStream} } }
                style={{width: "200px"}}
                autoPlay muted
              />
              <div style={{display: "flex", flexDirection: "row", justifyContent: "space-around", flexWrap: "wrap"}}>
                {remoteVideoDom}
              </div>
            </div>
          );
          break
      }
    };
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <Dialog
            actions={actions}
            modal={true}
            open={modal_open}
          >
            Mediaへのアクセスに失敗しました。
          </Dialog>

          <div className="App">
            {contents()}
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
