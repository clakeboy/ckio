import React from 'react';
import PropTypes from 'prop-types';
import * as Bin from '../../src/Bin';
import CKSocket from '../../src/CKSocket';
import {
    Button,
    TextArea,
    Input,
    Modal
} from '@clake/react-bootstrap4';

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logs: [],
            send_value: '',
        };
        this.socket =new CKSocket("http://127.0.0.1:27317",{});
        this.socket.on('backup',this.onReceived)
    }

    componentDidMount() {
        let intbyte = Bin.IntToBytes(100000,32);
        console.log(intbyte,intbyte.length,Bin.ByteToHexString(intbyte));
        console.log(Bin.BytesToInt(intbyte))
    }

    onConnect = () => {
        this.socket.open();
    };

    onSend = ()=> {
        let val = this.sendInput.getValue();
        if (val === '') {
            this.modal.alert('输入要发送的信息');
            return
        }
        this.state.logs.push('sent: '+val);
        this.setState({
            logs: this.state.logs
        },()=>{
            this.sendInput.setValue('');
            this.socket.emit('backup',val,(data)=>{
                this.onReceived('ack: '+data)
            });
        });
    };

    onReceived = (data) => {
        this.state.logs.push('received: '+data);
        this.setState({
            logs: this.state.logs
        });
    };

    render() {
        let u8arr = Bin.StringToUTF8Array("我是这个clake的SocketIO");
        console.log(u8arr);
        return (
            <div className='container'>
                <div>Test WebSocket</div>
                <div>
                    {Bin.ByteToHexString(u8arr)}
                </div>
                <div>
                    {Bin.UTF8ArrayToString(u8arr)}
                </div>

                <div>
                    <Button className='mb-1' onClick={this.onConnect}>开始连接</Button>
                    <TextArea height='300px' data={this.state.logs.join('\n')}/>
                    <div className='row no-gutters mt-1'>
                        <div className='col'>
                            <Input ref={c=>this.sendInput=c} className='mr-1'/>
                        </div>
                        <div className='col-1'>
                            <Button className='w-100' theme='success' onClick={this.onSend}>发送</Button>
                        </div>
                    </div>
                </div>
                <Modal ref={c=>this.modal=c}/>
            </div>
        );
    }
}

Main.contextTypes = {
    router: PropTypes.object
};

export default Main;