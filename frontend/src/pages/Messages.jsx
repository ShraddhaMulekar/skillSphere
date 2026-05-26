import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import { getMessages, sendMessage, getGigs } from "../api/marketplaceApi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";

export default function Messages() {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getCleanParam = (name) => {
    const val = searchParams.get(name);
    return (val === "null" || val === "undefined") ? "" : (val || "");
  };

  const initialReceiver = getCleanParam("receiver");
  const initialGig = getCleanParam("gig");

  const [form, setForm] = useState({
    receiver: initialReceiver,
    gig: initialGig,
    text: "",
    files: ""
  });
  const [typing, setTyping] = useState(false);
  const [activeTyping, setActiveTyping] = useState("");
  const socketRef = useRef(null);
  const peerConnection = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Video call state
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active
  const localVideoRef = useRef(null);
  
  // State for incoming call handling (freelancer side)
  const [incomingCallFrom, setIncomingCallFrom] = useState(null);
  const [showJoinButton, setShowJoinButton] = useState(false);

  const acceptCall = async () => {
    // Freelancer accepts the incoming call
    setInCall(true);
    setCallStatus('connecting');
    setShowJoinButton(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      // Add local tracks to existing peer connection (created on call_offer)
      if (peerConnection.current) {
        stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));
      }
      // Create answer after remote description is already set by call_offer listener
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socketRef.current.emit('call_answer', { to: incomingCallFrom, answer: peerConnection.current.localDescription });
      setCallStatus('active');
    } catch (err) {
      console.error('Failed to get media devices', err);
      setCallStatus('idle');
    }
  };

  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["messages"],
    queryFn: async () => (await getMessages()).data.messages,
  });

  const gigsQuery = useQuery({
    queryKey: ["gigs"],
    queryFn: async () => (await getGigs()).data.gigs,
  });

  // Determine if the current user can start a video call (only non-freelancers and when a receiver is selected)
  const isFreelancer = user?.role === "freelancer";
  const canStartCall = !isFreelancer && !!form.receiver && form.receiver !== "" && form.receiver !== "null" && form.receiver !== "undefined";

  const mutation = useMutation({
    mutationFn: () => sendMessage({
      ...form,
      files: form.files ? form.files.split(",").map((file) => file.trim()).filter(Boolean) : [],
    }),
    onSuccess: (res) => {
      const sentMsg = res.data.message;
      setForm((f) => ({ ...f, text: "", files: "" }));
      queryClient.setQueryData(["messages"], (old) => {
        if (!old) return [sentMsg];
        if (old.some((m) => m._id === sentMsg._id)) return old;
        return [...old, sentMsg];
      });

      if (socketRef.current && user) {
        socketRef.current.emit("typing", {
          room: form.receiver ? String(form.receiver) : "general",
          senderId: user.id || user._id,
          isTyping: false
        });
      }
    },
  });

  useEffect(() => {
    const rx = getCleanParam("receiver");
    const g = getCleanParam("gig");
    setForm((f) => ({ ...f, receiver: rx, gig: g }));
  }, [searchParams]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(API_URL, {
      withCredentials: true
    });
    socketRef.current = socket;

    const myId = user?.id || user?._id;
    if (myId) {
      socket.emit("register", myId);
    }

    socket.on("message_notification", (newMsg) => {
      queryClient.setQueryData(["messages"], (old) => {
        if (!old) return [newMsg];
        if (old.some((m) => m._id === newMsg._id)) return old;
        return [...old, newMsg];
      });
    });

      // Listen for incoming call requests
      socket.on('call_request', ({ from }) => {
        // Only freelancers should handle incoming calls
        if (user?.role === 'freelancer') {
          setIncomingCallFrom(from);
          setShowJoinButton(true);
          // Prepare form to have receiver set (so caller ID is known)
          setForm((f) => ({ ...f, receiver: from }));
        }
      });

    // Listen for call end notifications
    socket.on('call_end', ({ from }) => {
      if (String(from) === String(form.receiver)) {
        // Clean up local media
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        }
        setInCall(false);
        setCallStatus('idle');
        setShowJoinButton(false);
        setIncomingCallFrom(null);
      }
    });

    socket.on('call_offer', async ({ from, offer }) => {
        // Called on freelancer side when caller sends offer
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnection.current = pc;
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice_candidate', { to: from, candidate: event.candidate });
          }
        };
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Store caller ID for answer
        setIncomingCallFrom(from);
        setShowJoinButton(true);
        setForm((f) => ({ ...f, receiver: from }));
      });

      socket.on('call_answer', async ({ answer }) => {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
        // Mark call as active once answer is set
        setCallStatus('active');
      });

      socket.on('ice_candidate', async ({ candidate }) => {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  const handleTextChange = (e) => {
    setForm({ ...form, text: e.target.value });
    
    if (socketRef.current && user) {
      const myId = user.id || user._id;
      if (!typing) {
        setTyping(true);
        socketRef.current.emit("typing", {
          room: form.receiver ? String(form.receiver) : "general",
          senderId: myId,
          isTyping: true
        });
      }
      
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        setTyping(false);
        socketRef.current.emit("typing", {
          room: form.receiver ? String(form.receiver) : "general",
          senderId: myId,
          isTyping: false
        });
      }, 2000);
    }
  };

  const startCall = async () => {
    // Initiate a video call as client/admin
    if (!socketRef.current || !form.receiver) return;
    // Get local media first
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to get media devices', err);
      setCallStatus('idle');
      return;
    }
    // Create PeerConnection
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerConnection.current = pc;
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice_candidate', { to: form.receiver, candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
      // Include caller ID so the callee knows who sent the offer
      socketRef.current.emit('call_offer', { to: form.receiver, from: user?.id || user?._id, offer: pc.localDescription });
    // Notify the callee
    socketRef.current.emit('call_request', { to: form.receiver, from: user?.id || user?._id });
    setInCall(true);
    setCallStatus('connecting');
  };

  const endCall = () => {
    // Notify the other participant that the call has ended
    if (socketRef.current && form.receiver) {
      socketRef.current.emit('call_end', { to: form.receiver, from: user?.id || user?._id });
    }
    // Stop local media tracks
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setInCall(false);
    setCallStatus('idle');
  };

  const startConversation = (partnerId, gigId) => {
    const cleanId = (partnerId === "null" || partnerId === "undefined") ? "" : (partnerId || "");
    setSearchParams({ receiver: cleanId, gig: gigId || "" });
  };

  if (query.isLoading) return <Loader text="Loading messages..." />;

  const messages = query.data || [];
  const myId = String(user?.id || user?._id);

  // Compute available contacts from gigs
  const gigs = gigsQuery.data || [];
  const contactsMap = {};
  gigs.forEach((gig) => {
    if (gig.client && String(gig.client._id || gig.client) !== myId) {
      const cId = String(gig.client._id || gig.client);
      contactsMap[cId] = {
        _id: cId,
        name: gig.client.name || "Client",
        role: gig.client.role || "client",
        gigId: gig._id
      };
    }
    if (gig.assignedFreelancer && String(gig.assignedFreelancer._id || gig.assignedFreelancer) !== myId) {
      const fId = String(gig.assignedFreelancer._id || gig.assignedFreelancer);
      contactsMap[fId] = {
        _id: fId,
        name: gig.assignedFreelancer.name || "Freelancer",
        role: gig.assignedFreelancer.role || "freelancer",
        gigId: gig._id
      };
    }
  });
  const availableContacts = Object.values(contactsMap);
  
  // Extract and group active conversation partners
  const conversationsMap = {};
  messages.forEach((msg) => {
    if (!msg.sender || !msg.receiver) return;
    const senderId = msg.sender?._id ? String(msg.sender._id) : String(msg.sender);
    const receiverId = msg.receiver?._id ? String(msg.receiver._id) : String(msg.receiver);
    if (senderId === "null" || senderId === "undefined" || receiverId === "null" || receiverId === "undefined") return;
    const isMe = senderId === myId;
    const partner = isMe ? msg.receiver : msg.sender;
    const partnerId = isMe ? receiverId : senderId;
    
    if (partnerId && partnerId !== myId) {
      const partnerObj = (partner && typeof partner === "object" && partner._id)
        ? partner
        : { _id: partnerId, name: (partner && partner.name) || partnerId };
      
      if (!conversationsMap[partnerId] || new Date(msg.createdAt) > new Date(conversationsMap[partnerId].lastMessage.createdAt)) {
        conversationsMap[partnerId] = {
          partner: partnerObj,
          lastMessage: msg
        };
      }
      // Update partner name if we get a populated version
      if (partner && typeof partner === "object" && partner.name && conversationsMap[partnerId].partner.name === partnerId) {
        conversationsMap[partnerId].partner = partner;
      }
    }
  });

  const conversations = Object.values(conversationsMap).sort(
    (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
  );

  // Auto-select the first conversation if no receiver is set
  if (!form.receiver && conversations.length > 0) {
    const first = conversations[0];
    const gId = first.lastMessage.gig?._id || first.lastMessage.gig || "";
    setTimeout(() => startConversation(String(first.partner._id), gId), 0);
  }

  // Filter messages for current selected partner thread
  const filteredMessages = form.receiver
    ? messages.filter(
        (msg) =>
          (String(msg.sender?._id || msg.sender) === myId &&
            String(msg.receiver?._id || msg.receiver) === String(form.receiver)) ||
          (String(msg.receiver?._id || msg.receiver) === myId &&
            String(msg.sender?._id || msg.sender) === String(form.receiver))
      )
    : messages;

  const queryName = searchParams.get("name") || "";
  const currentPartner = conversations.find(c => String(c.partner._id) === String(form.receiver))?.partner || 
    (form.receiver && form.receiver !== "null" && form.receiver !== "undefined"
      ? { _id: form.receiver, name: queryName || "New Contact", role: "" }
      : null);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader title="Messages" subtitle="Message clients or freelancers, share files, and keep project chat history." />
      <Alert type="error" message={mutation.error?.response?.data?.message} />

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr_20rem] gap-5">
        {/* Left Column: Recent Conversations Sidebar */}
        <aside className="rounded-xl border border-white/10 bg-slate-800/50 p-4 h-fit space-y-3 order-2 lg:order-1">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-2">Recent Chats</h3>
          { conversations.length ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {conversations.map(({ partner, lastMessage }) => {
                const isActive = String(partner._id) === String(form.receiver);
                return (
                  <button
                    key={partner._id}
                    onClick={() => startConversation(partner._id, lastMessage.gig?._id || lastMessage.gig)}
                    className={`w-full text-left rounded-xl p-3 transition-all duration-200 block ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/30"
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-white text-xs font-semibold truncate">{partner.name}</p>
                      <span className="text-[9px] text-slate-500">
                        {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate mt-1">{lastMessage.text || "sent a file"}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-[11px]">No active chats. Click 'Chat' on a gig proposal to start!</p>
          )}

          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-2 pt-2">Start New Chat</h3>
          {availableContacts.length ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {availableContacts.map((contact) => {
                const isActive = String(contact._id) === String(form.receiver);
                return (
                  <button
                    key={contact._id}
                    onClick={() => startConversation(contact._id, contact.gigId)}
                    className={`w-full text-left rounded-xl p-3 transition-all duration-200 block ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/30"
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-white text-xs font-semibold truncate">{contact.name}</p>
                      <span className="text-[9px] text-cyan-400 uppercase font-semibold">
                        {contact.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-[11px]">No other active members found in Marketplace. Apply to gigs to start chatting!</p>
          )}
        </aside>

        {/* Middle Column: Chat Window */}
        <div className="space-y-4 order-1 lg:order-2">
          <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <h3 className="text-white font-semibold text-sm">
                {currentPartner ? `Chatting with: ${currentPartner.name}` : "Select a contact or open a gig to start chatting"}
              </h3>
              {currentPartner && (
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded uppercase font-semibold">
                  {currentPartner.role}
                </span>
              )}
            </div>
            
            <div className="relative">
              <textarea value={form.text} onChange={handleTextChange} rows={3} placeholder="Write a message..." className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm" />
              {activeTyping && (
                <div className="absolute bottom-2 right-3 text-cyan-300 text-xs flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  {activeTyping}
                </div>
              )}
            </div>
            <input value={form.files} onChange={(e) => setForm({ ...form, files: e.target.value })} placeholder="File URLs, comma separated" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-xs" />
            <div className="flex gap-2">
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.receiver || form.receiver === "null" || form.receiver === "undefined"}>Send</Button>
              {canStartCall && (
                <Button variant="secondary" onClick={startCall} disabled={!form.receiver || form.receiver === "null" || form.receiver === "undefined"}>📹 Start Video Call</Button>
              )}
              {isFreelancer && showJoinButton && (
                <Button variant="secondary" onClick={acceptCall}>📹 Join Video Call</Button>
              )}
            </div>
          </section>

          {filteredMessages.length ? (
            <div className="space-y-3">
              {filteredMessages.map((message) => {
                const isMe = String(message.sender?._id || message.sender) === String(user?.id || user?._id);
                return (
                  <div key={message._id} className={`rounded-xl border p-4 transition-all max-w-[85%] ${
                    isMe
                      ? "border-cyan-500/20 bg-cyan-500/5 ml-auto"
                      : "border-white/10 bg-slate-800/50 mr-auto"
                  }`}>
                    <div className="flex justify-between items-start gap-5">
                      <p className="text-slate-400 text-xs">
                        <span className="font-semibold text-slate-200">{message.sender?.name || "Sender"}</span>
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-white mt-1.5 text-sm whitespace-pre-wrap">{message.text}</p>
                    {!!message.files?.length && (
                      <div className="flex gap-2 mt-2.5">
                        {message.files.map((file, idx) => (
                          <a key={idx} href={file} target="_blank" rel="noreferrer" className="text-xs bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/20 transition-all">
                            📄 Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No messages in this thread" message={form.receiver ? "Type a message above to start collaborating!" : "Click an active conversation on the left, or chat from a gig proposal!"} />
          )}
        </div>

        {/* Right Column: Video Call */}
        {inCall && (
          <aside className="rounded-xl border border-white/10 bg-slate-800/50 p-4 h-fit space-y-4 animate-scale-up order-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-white font-semibold flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                WebRTC Video Call
              </h3>
              <span className="text-xs capitalize text-slate-400">{callStatus}</span>
            </div>
            
            <div className="aspect-video w-full bg-slate-950 rounded-lg overflow-hidden border border-white/10 relative flex items-center justify-center">
              {callStatus === "connecting" && (
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-300">Connecting WebRTC peer...</p>
                </div>
              )}
              {callStatus === "active" && (
                <div className="flex w-full h-full">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-1/2 h-full object-cover transform -scale-x-100" />
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 h-full object-cover" />
                </div>
              )}
            </div>

            <Button variant="danger" className="w-full text-xs" onClick={endCall}>🔴 End Call</Button>
          </aside>
        )}
      </div>
    </div>
  );
}
