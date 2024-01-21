//thank you pretendo for the decoding

const pako = require(process.cwd() + '/node_modules/pako')
const TGA = require(process.cwd() + '/node_modules/tga')
const PNG = require(process.cwd() + '/node_modules/pngjs').PNG
const BMP = require(process.cwd() + '/node_modules/bmp-js')
const zlib = require('zlib')

const jpegLib = require(process.cwd() + '/node_modules/jpeg-js')
const jimp = require(process.cwd() + '/node_modules/jimp')

const util = require('util')

const fs = require('fs')

function decodeParamPack(input) {
    let base64Result = Buffer.from(input, 'base64').toString();

    base64Result = base64Result.slice(1, -1).split("\\");
        
    const out = {};
    for (let i = 0; i < base64Result.length; i += 2) {
        out[base64Result[i].trim()] = base64Result[i + 1].trim();
    }
    return out;
}

function paintingProccess(painting, platform) {
    let paintingBuffer = Buffer.from(painting, 'base64');
    let output = '';
    try {
        output = pako.inflate(paintingBuffer);
    }
    catch (err) {
        console.error(err);
    }
    if (output[0] === 66) {
		const bitmap = BMP.decode(Buffer.from(output));
		const png = new PNG({
			width: bitmap.width,
			height: bitmap.height
		});

		const bpmBuffer = bitmap.getData();
		bpmBuffer.swap32();
		png.data = bpmBuffer;
		for (let i = 3; i < bpmBuffer.length; i += 4) {
			bpmBuffer[i] = 255;
		}
		return PNG.sync.write(png);
	} else {
		const tga = new TGA(Buffer.from(output));
		const png = new PNG({
			width: tga.width,
			height: tga.height
		});

		png.data = Buffer.from(tga.pixels);
		return PNG.sync.write(png);
	}
}

function decodeIcon(icon) {
    const icon2 = Buffer.from(icon, 'base64')

    var output = ''

    try {
        output = zlib.inflateSync(icon2)
    } catch (error) {
        console.log(error)
    }

    let tga = new TGA(Buffer.from(output))

    fs.writeFileSync('icon.tga', output)
}


function encodeIcon(community_id) {

    return new Promise((resolve, reject) => {
        jimp.read(`static/img/icons/${community_id}.jpg`, function(err, image) {
            const image2 = image.write(`${community_id}.tga`)
    
            const data = zlib.deflateSync(Buffer.from(image2.bitmap.data, 'base64')).toString('base64')

            image.write(`tga_icons/${community_id}.tga`)

            resolve('')
        })
    })
}

module.exports = {decodeParamPack, paintingProccess, decodeIcon, encodeIcon}