const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;


backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

//Taking the name whenever new user joins
const user = prompt("Enter your name: ");

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

let messages = document.querySelector(".messages");

const peers = {};

let myVideoStream;
//var getUserMedia = navigator.getUserMedia || navigator.webkitgetUserMedia  || navigator.mozgetUserMedia || navigator.msgetUserMedia;   
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });
     
    socket.on("user-connected", (userId, userName) => {
      setTimeout(() => {
        connectToNewUser(userId, stream)
        messages.innerHTML =
          messages.innerHTML + (`<div class="message"><small style="color:red"> ${userName} Joined Meeting</small></div>`); 
      }, 1000)
    })
  });
       

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  })   

  peers[userId] = call
};

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
//let messages = document.querySelector(".messages");  

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const shareScreen =document.querySelector("#shareScreen");

// AUDIO CONTROLS- Toggle to stop/start the audio
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

// VIDEO CONTROLS- Toggle to stop/start the video
stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

//Prompts the current room url and lets the user copy it and send it to others
inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

shareScreen.addEventListener("click", async ()=>{
const video = document.createElement("video");
let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia();
    let Sender = peer.getSenders().map(function (sender) {
      sender.replaceTrack(captureStream.getTracks().find(function (track) {
          return track.kind === sender.track.kind;
      }));
  });
    // Sender.replaceTrack(captureStream)
    // addVideoStream(video, captureStream);
    // video.srcObject = captureStream;
    // video.onloadedmetadata = function(e) {
    //   video.play();
    //   videoGrid.append(video);
    // };

  } catch(err) {
    console.error("Error: " + err);
  }
  //  return captureStream;
})

//Displays chat messages along with user name and time at which the message was sent
socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
      <div class = "profile" >
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <div class = "time">
            <time> ${ new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit" }) }</time>
          </div>
        </div>
        <span><b>${message}</b></span>
    </div>`;
  var chatWindow = document.querySelector(".main__chat_window");
  var xH = chatWindow.scrollHeight; 
  chatWindow.scrollTo(0, xH);
});

//whenever user leaves, a message prompted to everyone else
socket.on("user-disconnected", (userId, userName) => {
  setTimeout(() => {
    messages.innerHTML =
    messages.innerHTML + (`<div class="message"><small style="color:red">${userName} Left Meeting</small></div>`);
    if (peers[userId]) 
      peers[userId].close();
  }, 100)
});