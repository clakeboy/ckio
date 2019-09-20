import * as Bin from "./Bin";

class CKSocket {
    ws_url = "";
    re_url = "";
    ck_ws;
    ck_is_connect = false;
    events = {};
    acks = {};
    reconnect_num = 0;

    cfg = {
        path:'/socket.cio/',
        http_protocol:'transport',
        socket_protocol:'websocket',
        is_reconnect:true,
        reconnect_interval:5000,
        max_reconnect:100
    };

    constructor(url,options) {
        this.cfg = Object.assign({},this.cfg,options);
        let url_path = explainUrl(url);
        url_path.path = url_path.path || this.cfg.path;
        this.ws_url = url_path.prefix + url_path.domain + url_path.path + '?CIO=1&protocol=' + this.cfg.socket_protocol;
        this.re_url = url_path.org_prefix + url_path.domain + url_path.path + '?CIO=1&protocol=' + this.cfg.http_protocol;
    }

    open() {
        if (this.ck_ws) return;
        let connect_id = randStr(16);
        http({
            url:this.re_url+'&s='+connect_id,
            method:'GET',
            success:(text)=>{
                this.connect();
            },
            error:(text)=>{
                this.reconnect();
            }
        });
    }

    connect() {
        if (!this.ck_ws) {
            try {
                this.ck_ws = new WebSocket(this.ws_url);
                this.ck_ws.binaryType = 'arraybuffer';
                this.ck_ws.onerror = (evt)=>{
                    this.reconnect();
                    this.execEvent('error',evt);
                };
                this.ck_ws.onopen = (evt)=>{
                    this.ck_is_connect = true;
                    this.execEvent('connect','')
                };
                this.ck_ws.onclose = (evt) => {
                    this.ck_is_connect = false;
                    this.reconnect();
                    this.execEvent('disconnect','');
                };

                this.ck_ws.onmessage = (evt) => {
                    let event = this.deProtocol(evt.data);
                    this.execEvent(event.event,event.data,event.ack);
                }
            } catch (e) {
                this.execEvent('error',e);
            }
        }
    }

    reconnect() {
        if (this.cfg.is_reconnect && this.reconnect_num <= this.cfg.max_reconnect) {
            this.ck_ws = null;
            this.reconnect_num++;
            setTimeout(()=>{
                this.open();
            },this.cfg.reconnect_interval);
        }
    }

    close() {
        this.emit("disconnect");
        this.ck_ws.close();
        this.ck_is_connect = false;
    }

    send(is_ack,evt_name,message) {
        if (this.ck_is_connect) {
            // let evt = {
            //     event:evt_name,
            //     data:message
            // };
            // this.enProtocol(evt_name,message);
            let protocol = is_ack ? 0x0f: 0x01;
            this.ck_ws.send(this.enProtocol(protocol,evt_name,message));
        }
    }

    on(evt_name,func) {
        this.events[evt_name] = func;
    }

    off(evt_name) {
        delete this.events[evt_name];
    }

    emit(evt_name,data) {
        let ack = arguments[2] || null;
        if (typeof ack === 'function') {
            this.acks[evt_name] = ack;
        }
        this.send(false,evt_name,data);
    }

    execEvent(evt_name,data,is_ack) {
        if (is_ack) {
            let ack = this.acks[evt_name];
            if (typeof ack === 'function') {
                ack(data);
                delete this.acks[evt_name];
            }
        } else {
            let evt = this.events[evt_name];
            if (typeof evt === "function") {
                let rel = evt(data);
                if (rel) {
                    this.send(true,evt_name,rel)
                }
            }
        }
    }

    //data convert
    enProtocol(protocol,evt_name,message) {
        let protocol_arr = Uint8Array.of(protocol);
        let evt = Bin.StringToUTF8Array(evt_name);
        let evt_length = Bin.IntToBytes(evt.length,8);
        let content = Bin.StringToUTF8Array(message);

        return Bin.MergeTypeArray(Uint8Array,protocol_arr,evt_length,evt,content).buffer
    }

    deProtocol(data) {
        let u8a = new Uint8Array(data);
        let protocol = u8a[0];
        let evt_length = u8a[1];
        let evt_name = Bin.UTF8ArrayToString(u8a.subarray(2,2+evt_length));
        let content = Bin.UTF8ArrayToString(u8a.subarray(2+evt_length));
        console.log(protocol,evt_length,evt_name,content);
        return {
            ack: protocol === 0x0f,
            event: evt_name,
            data: content,
        };
    }
}

function randStr(str_length) {
    let chars = arguments[1] || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    let num;
    let out_str = "";
    for (let i=0;i<str_length;i++) {
        num = Math.round(Math.random()*chars.length);
        out_str += chars.substring(num, num+1);
    }
    chars = num = null;
    return out_str;
}

function explainUrl(url) {
    let exp = {
        prefix:'ws://',
        org_prefix:'http://',
        domain:'',
        path:''
    };
    let reg = /(http|https):\/\//;
    if (reg.test(url)) {
        if (/http:\/\//.test(url)) {
            exp.prefix = 'ws://';
            exp.org_prefix = 'http://';
        } else if (/https:\/\//.test(url)) {
            exp.prefix = 'wss://';
            exp.org_prefix = 'https://';
        }
        url = url.replace(reg,'');
    }

    let arr = url.split('/');
    exp.domain = arr.shift();
    exp.path = arr.join('/') !== ''?'/'+arr.join('/'):'';
    return exp;
}

function http(options){
    let cfg = {
        url:'',
        data:'',
        success:function(){},
        error:function(){},
        method:'POST',
        headers:null
    };

    cfg = Object.assign({},cfg,options);
    try {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    let response = xhr.responseText;
                    cfg.success(response);
                } else {
                    if (typeof cfg.error === 'function') {
                        cfg.error(xhr.responseText,xhr.status)
                    }
                }
            }
        };
        // xhr.withCredentials = true;
        xhr.open(cfg.method, cfg.url, true);
        xhr.setRequestHeader('Content-Type','application/json;charset=utf-8');
        if (cfg.headers) {
            let k;
            for (k in cfg.headers) {
                xhr.setRequestHeader(k,cfg.headers[k]);
            }
        }
        xhr.send(cfg.data);
    } catch(e) {
        if (typeof cfg.error === 'function') {
            cfg.error(e)
        }
    }
}

window.CKS = function(url){
    let options = arguments[1] || {};
    let so = new CKSocket(url,options);
    so.open();
    return so;
};

export default CKSocket;