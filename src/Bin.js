/**
 * @return {string}
 */
export function ByteToHexString(uint8arr) {
    if (!uint8arr) {
        return '';
    }

    let hexStr = '';
    for (let i = 0; i < uint8arr.length; i++) {
        let hex = (uint8arr[i] & 0xff).toString(16);
        hex = (hex.length === 1) ? '0' + hex : hex;
        hexStr += hex;
    }

    return hexStr.toUpperCase();
}

export function HexStringToByte(str) {
    if (!str) {
        return new Uint8Array();
    }

    let a = [];
    for (let i = 0, len = str.length; i < len; i+=2) {
        a.push(parseInt(str.substr(i,2),16));
    }

    return new Uint8Array(a);
}

/**
 * @return {string}
 */
export function UTF8ArrayToString(data) {
    // const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
    // let count = data.length;
    // let str = "";
    //
    // for (let index = 0;index < count;) {
    //     let ch = data[index++];
    //     if (ch & 0x80)
    //     {
    //         let extra = extraByteMap[(ch >> 3) & 0x07];
    //         if (!(ch & 0x40) || !extra || ((index + extra) > count))
    //             return null;
    //
    //         ch = ch & (0x3F >> extra);
    //         for (;extra > 0;extra -= 1)
    //         {
    //             let chx = data[index++];
    //             if ((chx & 0xC0) !== 0x80)
    //                 return null;
    //             ch = (ch << 6) | (chx & 0x3F);
    //         }
    //     }
    //
    //     str += String.fromCharCode(ch);
    // }
    //
    // return str;
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(data)
}

export function StringToUTF8Array(str) {
    // let utf8 = [];
    // for (let i=0; i < str.length; i++) {
    //     let charCode = str.charCodeAt(i);
    //     if (charCode < 0x80) utf8.push(charCode);
    //     else if (charCode < 0x800) {
    //         utf8.push(0xc0 | (charCode >> 6),
    //             0x80 | (charCode & 0x3f));
    //     }
    //     else if (charCode < 0xd800 || charCode >= 0xe000) {
    //         utf8.push(0xe0 | (charCode >> 12),
    //             0x80 | ((charCode>>6) & 0x3f),
    //             0x80 | (charCode & 0x3f));
    //     }
    //     // surrogate pair
    //     else {
    //         i++;
    //         // UTF-16 encodes 0x10000-0x10FFFF by
    //         // subtracting 0x10000 and splitting the
    //         // 20 bits of 0x0-0xFFFFF into two halves
    //         charCode = 0x10000 + (((charCode & 0x3ff)<<10)
    //             | (str.charCodeAt(i) & 0x3ff))
    //         utf8.push(0xf0 | (charCode >>18),
    //             0x80 | ((charCode>>12) & 0x3f),
    //             0x80 | ((charCode>>6) & 0x3f),
    //             0x80 | (charCode & 0x3f));
    //     }
    // }
    // return Uint8Array.from(utf8);

    const encoder = new TextEncoder();
    return encoder.encode(str)
}

export function IntToBytes(num,bit) {
    let arr,view;
    switch (bit) {
        case 8:
            arr = new ArrayBuffer(1); // an Int8 takes 1 bytes
            view = new DataView(arr);
            view.setUint8(0, num); // byteOffset = 0; litteEndian = false
            break;
        case 16:
            arr = new ArrayBuffer(2); // an Int16 takes 2 bytes
            view = new DataView(arr);
            view.setUint16(0, num,false); // byteOffset = 0; litteEndian = false
            break;
        case 32:
            arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
            view = new DataView(arr);
            view.setUint32(0, num,false); // byteOffset = 0; litteEndian = false
            break;
        case 64:
            arr = new ArrayBuffer(8); // an Int64 takes 8 bytes
            view = new DataView(arr);
            view.setBigUint64(0, num,false); // byteOffset = 0; litteEndian = false
            break;
    }

    return new Uint8Array(arr);
}

export function BytesToInt(bytes) {
    let view = new DataView(bytes.buffer);
    let returned;
    switch (bytes.length) {
        case 1:
            returned = view.getUint8(0);
            break;
        case 2:
            returned = view.getUint16(0,false);
            break;
        case 4:
            returned = view.getUint32(0,false);
            break;
        case 8:
            returned = view.getBigUint64(0,false);
            break;
    }
    return returned;
}

export function MergeTypeArray(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new resultConstructor(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
