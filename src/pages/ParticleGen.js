import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/particleGen.module.css';
const { Jimp } = require('jimp');
const { intToRGBA } = require('@jimp/utils');

const SPACING = 0.25;
const DEFAULT_MAX_SIZE = 32;
const MIN_SIZE = 8;
const BASE_Y = 2;
const SCALE = 20; //pixels per block for preview I think this needs to be a bit different...
const CANVAS_SIZE = 300; //canvas width and height
const PLAYER_WIDTH = 0.6; //blocks
const PLAYER_HEIGHT = 1.8; //blocks
const PLAYER_DEPTH = 0.6; //blocks

//function to make image to particle
async function generateMinecraftParticles(image, spacing = SPACING, particleOffsetX = 0, particleOffsetY = 0, particleOffsetZ = 0, tag = 'particle') {
  try {
    const maxSize = DEFAULT_MAX_SIZE;
    let width = image.bitmap.width;
    let height = image.bitmap.height;
    if(width > maxSize || height > maxSize) {
      const scale = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
      image.resize({w: width, h: height, mode: Jimp.RESIZE_NEAREST_NEIGHBOR});
    }
    const sizeX = width;
    const sizeY = height;
    const halfSizeX = sizeX / 2;
    const cbOffsetX = 2;
    const cbOffsetZ = 0;
    const baseY = BASE_Y + particleOffsetY + spacing / 2;
    const rowData = [];
    for(let y = 0; y < sizeY; y++) {
      const visiblePixels = [];
      for(let x = 0; x < sizeX; x++) {
        const color = image.getPixelColor(x, y);
        const { r, g, b, a } = intToRGBA(color);
        if(a > 0) {
          visiblePixels.push({ x, rf: (r / 255).toFixed(3), gf: (g / 255).toFixed(3), bf: (b / 255).toFixed(3), r, g, b, a });
        }
      }
      if(visiblePixels.length > 0) {
        rowData.push({ y, pixels: visiblePixels });
      }
    }
    const setblockCmds = [];
    for(const row of rowData) {
      const rowY = row.y;
      for(let pixIdx = 0; pixIdx < row.pixels.length; pixIdx++) {
        const pixel = row.pixels[pixIdx];
        const origX = pixel.x;
        const posX = (particleOffsetX + (origX - halfSizeX + 0.5) * spacing).toFixed(2);
        const posY = (baseY + (sizeY - 1 - rowY) * spacing).toFixed(2);
        const posZ = particleOffsetZ.toFixed(2);
        const particleCmd = `execute as @e[tag=${tag}] at @s run particle dust{color:[${pixel.rf},${pixel.gf},${pixel.bf}],scale:1} ^${posX} ^${posY} ^${posZ} 0 0 0 0 0 normal`;
        const isRepeating = (pixIdx === 0);
        const type = isRepeating ? 'repeating_command_block' : 'chain_command_block';
        const auto = isRepeating ? '0b' : '1b';
        const cbX = rowY;
        const cbY = -1;
        const cbZ = -pixIdx;
        const pos = `~${cbOffsetX + cbX} ~${cbY} ~${cbOffsetZ + cbZ}`;
        const setblockCmd = `setblock ${pos} minecraft:${type}[facing=north]{Command:"${particleCmd}",auto:${auto}} replace`;
        setblockCmds.push(setblockCmd);
      }
    }
    if(setblockCmds.length === 0) {
      console.warn('No non-transparent pixels found.');
      return [];
    }
    const oneCmds = generateOneCommands(setblockCmds);
    return oneCmds;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

//function to create the one command
function generateOneCommands(setblockCmds) {
  const maxLength = 32500;
  const summonBase = 'summon falling_block ~ ~1 ~ {BlockState:{Name:"activator_rail"},Time:1,Passengers:[';
  const summonEnd = ']}';
  const oneCommands = [];
  let cmdsToProcess = [...setblockCmds];
  while(cmdsToProcess.length > 0) {
    let cmdsInGroup = [];
    while(cmdsToProcess.length > 0) {
      const testCmd = cmdsToProcess.shift();
      cmdsInGroup.push(testCmd);
      const tempPassengers = buildPassengers(cmdsInGroup);
      const testFull = summonBase + tempPassengers + summonEnd;
      if(testFull.length > maxLength) {
        cmdsToProcess.unshift(cmdsInGroup.pop());
        break;
      }
    }
    if(cmdsInGroup.length === 0) {
      console.error('Single setblock command too long!');
      break;
    }
    const passengers = buildPassengers(cmdsInGroup);
    const fullCommand = summonBase + passengers + summonEnd;
    oneCommands.push(fullCommand);
  }
  return oneCommands;
}

function buildPassengers(cmdsInGroup) {
  const batchSize = 10;
  const batches = [];
  for(let i = 0; i < cmdsInGroup.length; i += batchSize) {
    batches.push(cmdsInGroup.slice(i, i + batchSize));
  }
  if(batches.length === 0) return '';
  let currentSubPassengers = '';
  let batchId = 0;
  for(let b = batches.length - 1; b >= 0; b--) {
    const batchCmds = batches[b];
    const batchTag = `batch${batchId}`;
    batchId++;
    const killCommand = `kill @e[type=command_block_minecart,tag=${batchTag},distance=..3]`;
    let batchP = addMinecartToString(currentSubPassengers, killCommand, batchTag);
    for(let i = batchCmds.length - 1; i >= 0; i--) {
      batchP = addMinecartToString(batchP, batchCmds[i], batchTag);
    }
    currentSubPassengers = batchP;
  }
  return currentSubPassengers;
}

function addMinecartToString(existing, cmd, tag = '') {
  const escaped = cmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  let nbt = `Command:"${escaped}"`;
  if(tag) {
    nbt += `,Tags:["${tag}"]`;
  }
  const passengersStr = existing ? `Passengers:[${existing}]` : '';
  return `{id:"command_block_minecart",${nbt}${passengersStr ? ',' + passengersStr : ''}}`;
}

const ParticleGen = () => {
  const [maxSize, setMaxSize] = useState(DEFAULT_MAX_SIZE);
  const [tag, setTag] = useState('particle');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(2);
  const [offsetZ, setOffsetZ] = useState(0);
  const [originalImage, setOriginalImage] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [generatedCommands, setGeneratedCommands] = useState([]);
  const frontCanvasRef = useRef(null);
  const sideCanvasRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target.result;
        const image = await Jimp.read(buffer);
        setOriginalImage(image);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  useEffect(() => {
    const processImage = async () => {
      if(originalImage) {
        const image = originalImage.clone();
        let w = image.bitmap.width;
        let h = image.bitmap.height;
        const scaleFactor = Math.min(maxSize / w, maxSize / h);
        if(scaleFactor < 1) {
          w = Math.floor(w * scaleFactor);
          h = Math.floor(h * scaleFactor);
          image.resize({w: w, h: h, mode: Jimp.RESIZE_NEAREST_NEIGHBOR});
        }
        const tempRowData = [];
        for(let y = 0; y < h; y++) {
          const visiblePixels = [];
          for(let x = 0; x < w; x++) {
            const color = image.getPixelColor(x, y);
            const { r, g, b, a } = intToRGBA(color);
            if(a > 0) {
              visiblePixels.push({ x, r, g, b, a, rf: (r / 255).toFixed(3), gf: (g / 255).toFixed(3), bf: (b / 255).toFixed(3) });
            }
          }
          if(visiblePixels.length > 0) {
            tempRowData.push({ y, pixels: visiblePixels });
          }
        }
        setRowData(tempRowData);
        setImageWidth(w);
        setImageHeight(h);
      }
    };
    processImage();
  }, [originalImage, maxSize]);

  useEffect(() => {
    const drawPreview = (canvas, isFront) => {
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      //background
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      //player rectangle
      ctx.fillStyle = '#f952ffff';
      const playerW = (isFront ? PLAYER_WIDTH : PLAYER_DEPTH) * SCALE;
      const playerH = PLAYER_HEIGHT * SCALE;
      const playerX = CANVAS_SIZE / 2 - playerW / 2;
      const playerY = CANVAS_SIZE - playerH;
      ctx.fillRect(playerX, playerY, playerW, playerH);

      //particle image
      const halfSizeX = imageWidth / 2;
      const baseYVal = BASE_Y + offsetY + SPACING / 2;
      const particleSize = SPACING * SCALE;
      rowData.forEach((row) => {
        const rowY = row.y;
        row.pixels.forEach((pixel) => {
          const origX = pixel.x;
          const posX = offsetX + (origX - halfSizeX + 0.5) * SPACING;
          const posY = baseYVal + (imageHeight - 1 - rowY) * SPACING;
          const posZ = offsetZ;
          ctx.fillStyle = `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a / 255})`;

          const drawX = isFront ? posX : posZ;
          const centerX = CANVAS_SIZE / 2 + drawX * SCALE;
          const centerY = CANVAS_SIZE - posY * SCALE;
          ctx.fillRect(centerX - particleSize / 2, centerY - particleSize / 2, particleSize, particleSize);
        });
      });
    };

    drawPreview(frontCanvasRef.current, true);
    drawPreview(sideCanvasRef.current, false);
  }, [rowData, offsetX, offsetY, offsetZ, imageWidth, imageHeight]);

  const handleGenerate = async () => {
    if(originalImage) {
      const resizedImage = originalImage.clone();
      const commands = await generateMinecraftParticles(resizedImage, SPACING, offsetX, offsetY, offsetZ, tag);
      setGeneratedCommands(commands);
    }
  };

  const handleCopy = (command) => {
    navigator.clipboard.writeText(command);
    alert('Command copied to clipboard!');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Minecraft Particle Image Generator</h1>
      <div className={styles.main}>
        <div className={styles.left}>
          <label>Upload Image:</label>
          <input type="file" accept="image/*" onChange={handleUpload} />
          <label>Max Size (8-32):</label>
          <input
            type="number"
            value={maxSize}
            min={MIN_SIZE}
            max={DEFAULT_MAX_SIZE}
            onChange={(e) => setMaxSize(Math.max(MIN_SIZE, Math.min(DEFAULT_MAX_SIZE, parseInt(e.target.value) || DEFAULT_MAX_SIZE)))}
          />
          <label>Tag Name:</label>
          <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} />
          <label>Offset X:</label>
          <input type="number" value={offsetX} onChange={(e) => setOffsetX(parseFloat(e.target.value) || 0)} step="0.1" />
          <label>Offset Y:</label>
          <input type="number" value={offsetY} onChange={(e) => setOffsetY(parseFloat(e.target.value) || 0)} step="0.1" />
          <label>Offset Z:</label>
          <input type="number" value={offsetZ} onChange={(e) => setOffsetZ(parseFloat(e.target.value) || 0)} step="0.1" />
          <button onClick={handleGenerate} className={styles.button}>Generate One Commands</button>
          {generatedCommands.length > 0 && (
            <div className={styles.commands}>
              <h3>Generated Commands:</h3>
              {generatedCommands.map((cmd, index) => (
                <button key={index} onClick={() => handleCopy(cmd)} className={styles.copyButton}>
                  Copy Command {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.right}>
          <h3>Preview</h3>
          <div className={styles.preview}>
            <div>
              <h4>Front View</h4>
              <canvas ref={frontCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
            </div>
            <div>
              <h4>Side View</h4>
              <canvas ref={sideCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.tutorial}>
        <h3>How to Use:</h3>
        <p>1. Tag an entity with the provided tag: /tag @e add {tag}</p>
        <p>2. Make a backup of your world, as command blocks can potentially cause issues if misused.</p>
        <p>3. The command blocks will be placed north of the initial command block position.</p>
        <p>4. Place a single command block down and activate it with a lever to run the one-command.</p>
        <p>5. Wait until all command block minecarts disappear before pasting and running the next one-command.</p>
        <p>6. Once all are placed, add levers to the command blocks to activate them.</p>
      </div>
    </div>
  );
};

export default ParticleGen;