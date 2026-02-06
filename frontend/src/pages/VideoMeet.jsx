import React, { useRef, useState } from 'react'
import io from "socket.io-client";
import style from '../style/videoMeet.module.css';
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge"
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import { useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from "react-router-dom";




const server_url = `${import.meta.env.VITE_BACKEND_URL}`;

var connections = {};

const peerConfigConnections = {
    "iceServers" : [
      { "urls" : "stun:stun.l.google.com:19302" }
    ]
}

const VideoMeet = () => {

    var socketRef = useRef(); // socket.io reference
    let socketIdRef = useRef(); // store current socket id
    const videoRef = useRef([]); // store remote video elements
    let localVideoRef = useRef(); // store local video element

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(false);
    let [audio, setAudio] = useState(false);
    let [screen, setScreen] = useState(false);
    let [showModel, setShowModel] =  useState(true);
    let [screenAvailable, setScreenAvailable] = useState(false);
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    let [videos, setVideos] = useState([]);

    // Run on component mount to get permissions
    useEffect(()=>{
      getPermissions(); 
    },[]);

    // Handle screen sharing stream
    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
              
              navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
              .then(getDislayMediaSuccess)
              .then((stream) => { })
              .catch((e) => console.log(e))
            }
        }
    }

    // Ask user for video/audio permissions
    const getPermissions = async () => {
      try {

      //video permission
      const videoPermission = await navigator.mediaDevices.getUserMedia({video : true});
      if(videoPermission){
        setVideoAvailable(true);
      }else{
        setVideoAvailable(false);
      }

      //audio permission
      const audioPermission = await navigator.mediaDevices.getUserMedia({audio : true});
      if(audioPermission){
        setAudioAvailable(true);
      }else{
        setAudioAvailable(false);
      }

      //for screen sharing is supported or not
      if(navigator.mediaDevices.getDisplayMedia){
        setScreenAvailable(true);
      }else{
        setScreenAvailable(false);
      }

      // If at least one media is available, attach to local video
      if(videoAvailable || audioAvailable){
        const userMediaStrem = await navigator.mediaDevices.getUserMedia({video : videoAvailable, audio: audioAvailable});
        if(userMediaStrem){
          window.localStream = userMediaStrem;
          if(localVideoRef.current){ //
            localVideoRef.current.srcObject = userMediaStrem;
          } 
        }
      }

      } catch (error) {
        console.log(error)
      }
    }

    // Update user media when video/audio toggled
    useEffect(()=>{
      if(video !== undefined && audio !== undefined){
        getUserMedia();
      }
    },[audio, video]);

    //start video/audio and connect to socket server
    let getMedia = () =>{
      setVideo(videoAvailable);
      setAudio(audioAvailable);
      connectToSocketServer();
    }


    let getUserMediaSuccess = (stream) => {
      try {
        window.localStream.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.log(error);
      }

      window.localStream = stream;
      localVideoRef.current.srcObject = stream;

      // Send new stream to all peers
      for(let id in connections){
        if(id === socketIdRef.current){ continue; }

        connections[id].addStream(window.localStream)
        connections[id].createOffer().then((description)=>{
          connections[id].setLocalDescription(description).then(()=>{
            socketRef.current.emit('signal', id, JSON.stringify({'sdp' : connections[id].localDescription }))
          }).catch((e)=> console.log(e))

        })
      }
      // Handle end of tracks
      stream.getTracks().forEach((track)=> track.onended = () => {
        setVideo(false)
        setAudio(false)

        try {
          
          let tracks = localVideoRef.current.srcObject.getTracks()
          tracks.forEach((track)=> track.stop())
        } catch (error) {
          console.log(error)
        }

        //TODO blackSilence
        let blackSlience = (...args ) => new MediaStream([black(...args), silence()])
        window.localStream = blackSlience()
        localVideoRef.current.srcObject = window.localStream


        for(let id in connections){
          connections[id].addStream(window.localStream)
          connections[id].createOffer().then((description)=>{
            connections[id].setLocalDescription(description)
            .then(()=>{
              socketRef.current.emit('signal', id, JSON.stringify({ 'sdp' : connections[id].localDescription }))
            }).catch((e)=> console.log(e))
          })
        }
      })
    }


     // Get user media when video/audio toggled
    let getUserMedia = () => {
      if((video && videoAvailable) || (audio && audioAvailable)){
        navigator.mediaDevices.getUserMedia({video: video, audio: audio})
        .then(getUserMediaSuccess) // TODO: getUserMediaSucess 
        .then((stream)=>{})
        .catch((e)=> console.log(e))
      }else{
        try {
          let tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        } catch (error) {
          
        }
      }
    }

    // Handle screen sharing success
    let getDislayMediaSuccess = (stream) =>{
      try {
        window.localStream.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.log(error)
      }

      window.localStream = stream;
      localVideoRef.current.srcObject = stream;

      for(let id in connections){
        if(id === socketIdRef.current) continue;

        connections[id].addStream(window.localStream)
        connections[id].createOffer().then((description)=>{
          connections[id].setLocalDescription(description)
          .then(()=>{
            socketRef.current.emit('signal',id, JSON.stringify({'sdp' : connections[id].localDescription}))
          })
          .catch((e)=> console.log(e));
        })
      }

      // Handle end of screen share
      stream.getTracks().forEach(track => track.onended = () => {
        setScreen(false)

        try {
          let tracks = localVideoRef.current.srcObject.getTracks()
          tracks.forEach(track => track.stop())
        } catch (e) { console.log(e) }

        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = blackSilence()
        localVideoRef.current.srcObject = window.localStream

        getUserMedia()

      })


    }

    // Handle incoming signaling messages from server
    let gotMessageFromSever = (fromId, message) => {

      var signal = JSON.parse(message)
      if(fromId !== socketIdRef.current){

        if(signal.sdp){
          connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(()=>{
            if(signal.sdp.type === "offer") {

              connections[fromId].createAnswer().then((description)=>{
                connections[fromId].setLocalDescription(description).then(()=>{
                  socketRef.current.emit('signal', fromId, JSON.stringify({'sdp' : connections[fromId].localDescription}))
                }).catch((e)=>console.log(e))
              }).catch((e)=> console.log(e))

            }
          }).catch((e)=> console.log(e))
        }

        if(signal.ice){
          connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e)=> console.log(e))
        }
      }
    }

    //Todo addMessage
    let addMessage = (data, sender, socketIdSender) => {

      setMessages((prevMessages)=> [
        ...prevMessages, 
        {sender : sender, data : data},
      ]);

      if(socketIdSender !== socketIdRef.current){
        setNewMessages((prevMessages)=> prevMessages + 1);
      }

    }

    // Connect to socket.io server
    let connectToSocketServer = () => {

      socketRef.current = io.connect(server_url, { secure : false });
      socketRef.current.on('signal', gotMessageFromSever);

      socketRef.current.on('connect', ()=>{
        socketRef.current.emit("join-call", window.location.href);
        socketIdRef.current = socketRef.current.id
        socketRef.current.on('chat-message', addMessage)

        // Remove video when user leaves
        socketRef.current.on('user-left', (id)=>{
          setVideos((videos)=>videos.filter((video)=> video.socketId !== id ))
        })

        // Handle new user joining
        socketRef.current.on('user-joined', (id, clients)=>{
          clients.forEach((socketListId)=> {
            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
            
            // Wait for their ice candidate 
            connections[socketListId].onicecandidate = (event) => {
              if(event.candidate != null ){
                socketRef.current.emit('signal', socketListId, JSON.stringify({'ice' : event.candidate }))
              }
            }

             // Wait for their video stream
            connections[socketListId].onaddstream = (event) => { 

              let videoExists = videoRef.current.find(video => video.socketId === socketListId )

              if(videoExists){

                 // Update the stream of the existing video
                setVideos(videos => {
                  const updatedVideos = videos.map(v => v.socketId === socketListId ? { ...v, stream: event.stream } : v);
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                })
              }else{
                // Create a new video
                let newVideo = {
                  socketId : socketListId,
                  stream : event.stream,
                  autoPlay : true,
                  playsinline : true
                }

                setVideos(videos => {
                  const updatedVideos = [...videos, newVideo];
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                })
              }
            }

             // Add the local video stream
            if(window.localStream !== undefined && window.localStream !== null){
              connections[socketListId].addStream(window.localStream);
            }else{
              //TODO blackslience

              let blackSlience = (...args ) => new MediaStream([black(...args), silence()])
              window.localStream = blackSlience()
              connections[socketListId].addStream(window.localStream);

            }

          })

          // If self joined, create offers to all others
          if(id === socketIdRef.current){
            for(let id2 in connections){
              if(id2 === socketIdRef.current){continue;}
              try {
                connections[id2].addStream(window.localStream);
              } catch (error) {
                console.log(error)
              }
              connections[id2].createOffer().then((description)=> {
                connections[id2].setLocalDescription(description)
                .then(()=>{
                  socketRef.current.emit('signal', id2, JSON.stringify({'sdp': connections[id2].localDescription }))
                })
                .catch((e)=> console.log(e))
              })
            }
          }
        })
      })

    } 

    // Generate silent audio track
    let silence = () => {
      let ctx = new AudioContext()
      let oscillator = ctx.createOscillator();
      let dst = oscillator.connect(ctx.createMediaStreamDestination());
      oscillator.start()
      ctx.resume()

      return Object.assign(dst.stream.getAudioTracks()[0], { enabled : false })
    }

    // Generate black video track
    let black = ({ width = 640, height = 480 } = {}) => {
      let canvas = Object.assign(document.createElement("canvas"), {  width, height})

      canvas.getContext('2d').fillRect(0, 0, width, height)
      let stream = canvas.captureStream();
      return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    } 
      
    let routeTo = useNavigate();

    // Connect button action
    let connect = () => {
      setAskForUsername(false);
      getMedia();
    }

    let handleVideo = () => {
      const newVal = !video;
      setVideo(newVal);
    }

    let handleAudeo = () => {
      setAudio(!audio);
    }

    useEffect(()=>{
      if(screen !== undefined){
        getDislayMedia();
      }
    },[screen])

    let handleScreen = () => {
      setScreen(!screen);
    }

    let sendMessage = (e) =>{
      socketRef.current.emit('chat-message', message, username);
      setMessage("");
    }

    let handleEndCall = () => {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (error) { }

      routeTo("/home")
    
    }

  return (
    <div>
        {askForUsername === true? 
        <div className={style.lobbyContainer}>

          <h2>Enter into lobby</h2>
          <TextField id="outlined-basic" label="username" value={username} onChange={(e)=>setUsername(e.target.value)} variant="outlined" />
          <Button variant="outlined" style={{padding: "14px", marginLeft: "2px"}}   onClick={connect} >Connect</Button>
          <div className={style.lobbyVideo}>
            <video ref={ localVideoRef } autoPlay muted></video>
          </div>

        </div> : 
        
        <div className={style.meetVideoContiner} >

          {/* -----chat box----------- */}

          {showModel? 
          <div  className={style.chatRoom}>
            <div className={style.chatContainer}>
              <h1>Chat</h1>

              <div className={style.chattingDisplay}>

                {messages.length > 0 ? messages.map((item, index)=>{
                  return (
                    <div key={index} style={{marginBottom: "20px"}}>
                      <p style={{fontWeight: "bold"}}> {item.sender} </p>
                      <p> {item.data} </p>
                    </div>
                  )
                }) : <p>No Messages Yet</p>}

              </div>

              <div className={style.chatingArea}>
                <TextField value={message} onChange={(e)=>setMessage(e.target.value)} id='outline-basic' label='Enter Your Chat' variant="outlined" />
                <Button style={{padding: "14px", marginLeft: "2px"}} onClick={sendMessage} variant='contained'>Send</Button>
              </div>

            </div>
          </div>
          :<></>}


          <div className={style.btnContainer}>
            <IconButton onClick={handleVideo}>
              {(video === true ? <VideocamIcon /> : <VideocamOffIcon /> )}
            </IconButton>
            <IconButton onClick={handleEndCall}>
              <CallEndIcon style={{color:"red"}} />
            </IconButton>
            <IconButton onClick={handleAudeo}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

             {screenAvailable === true ? 
                <IconButton onClick={handleScreen}>
                  {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                </IconButton> : <></>
             }

            <Badge badgeContent={newMessages} max={999} color='secondry' style={{color:"#fff"}} >
              <IconButton onClick={()=>setShowModel(!showModel)}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video className={style.meetUserVideo} ref={ localVideoRef } autoPlay muted></video>
          <div className={style.conferenceView}>
          {videos.map((video) => (
              <div key={video.socketId} >

                <video
                  data-socket={ video.socketId }
                  ref={ref =>{
                    if(ref && video.stream){ 
                      ref.srcObject = video.stream;
                    }
                  }} 
                  autoPlay 
                >

                </video>
              </div>
            ))} 
          </div>       
        </div>}
    </div>
  )
}

export default VideoMeet