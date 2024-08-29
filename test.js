import { Buffer } from "buffer";
import bencode from "bencode";

const obj={
    int:12,
    str:"hello",
    list:[1,2,3],
    dict:{key:"value"}
}
const dec=bencode.encode(obj);

const buf = Buffer.from(dec);
console.log(dec)