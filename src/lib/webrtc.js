export class WebRTCManager {
  constructor(peerId, assignedIp) {
    this.peerId = peerId;
    this.assignedIp = assignedIp;
    this.connections = new Map(); // peerId -> { pc, dc }
    this.events = new EventTarget();
    this._pendingPc = null;
  }

  on(event, callback) {
    this.events.addEventListener(event, (e) => callback(e.detail));
  }

  emit(event, detail) {
    this.events.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /**
   * HOST: Create an offer for a new peer
   */
  async createOffer() {
    const pc = new RTCPeerConnection({ iceServers: [] });
    const dc = pc.createDataChannel('pulsemesh-sync');
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const payload = await this._waitForIce(pc);
    this._setupConnection(pc, dc, 'hosting');
    return payload;
  }

  /**
   * JOINER: Process offer and create answer
   */
  async createAnswer(base64Offer) {
    const pc = new RTCPeerConnection({ iceServers: [] });
    
    const minified = JSON.parse(atob(base64Offer));
    const offer = { type: 'offer', sdp: this._expandSDP(minified.s) };
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const answerPayload = await this._waitForIce(pc);
    this._setupConnection(pc, null, 'joining');
    return answerPayload;
  }

  /**
   * HOST: Finalize connection with answer
   */
  async processAnswer(base64Answer) {
    const minified = JSON.parse(atob(base64Answer));
    const answer = { type: 'answer', sdp: this._expandSDP(minified.s) };
    
    if (this._pendingPc) {
      await this._pendingPc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  _setupConnection(pc, dc, role) {
    if (dc) this._bindChannel(dc, pc);
    
    pc.ondatachannel = (event) => {
      this._bindChannel(event.channel, pc);
    };

    pc.oniceconnectionstatechange = () => {
      this.emit('connectionStateChange', { state: pc.iceConnectionState, peerCount: this.connections.size });
    };
  }

  _bindChannel(dc, pc) {
    dc.onopen = () => {
      const id = `peer-${Math.random().toString(36).substr(2, 5)}`;
      this.connections.set(id, { pc, dc });
      this.emit('peerConnected', { id, count: this.connections.size });
    };

    dc.onmessage = (e) => {
      const data = JSON.parse(e.data);
      this.emit('data', data);
    };

    dc.onclose = () => {
      // Find and remove
      for (const [id, conn] of this.connections.entries()) {
        if (conn.dc === dc) {
          this.connections.delete(id);
          this.emit('peerDisconnected', { id, count: this.connections.size });
          break;
        }
      }
    };
  }

  send(data) {
    const payload = JSON.stringify(data);
    this.connections.forEach(conn => {
      if (conn.dc.readyState === 'open') conn.dc.send(payload);
    });
  }

  _waitForIce(pc) {
    this._pendingPc = pc;
    return new Promise((resolve) => {
      const finish = () => {
        const desc = pc.localDescription;
        resolve(btoa(JSON.stringify({ t: desc.type[0], s: this._minifySDP(desc.sdp) })));
      };
      if (pc.iceGatheringState === 'complete') { finish(); return; }
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') finish();
      };
      setTimeout(finish, 3000);
    });
  }

  _minifySDP(sdp) {
    const ip = this.assignedIp || window.location.hostname;
    return sdp.split('\r\n')
      .map(l => l.includes('.local') ? l.replace(/[a-z0-9-]+\.local/gi, ip) : l)
      .filter(l => !['a=extmap:', 'a=rtcp-fb:', 'a=fmtp:', 'a=msid:', 'a=ssrc:'].some(p => l.startsWith(p)))
      .join('\n');
  }

  _expandSDP(s) { return s.split('\n').join('\r\n'); }

  cleanup() {
    this.connections.forEach(conn => {
      conn.dc.close();
      conn.pc.close();
    });
    this.connections.clear();
  }
}
