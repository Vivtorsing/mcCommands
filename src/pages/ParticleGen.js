import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/particleGen.module.css';
import Vivtorsing from '../assets/vivtorsing.png';
const { Jimp } = require('jimp');
const { intToRGBA } = require('@jimp/utils');

const SPACING = 0.25; //space between each particles
const DEFAULT_MAX_SIZE = 32;
const MIN_SIZE = 8;
const BASE_Y = 2; //blocks above player

//player dimension in blocks
//keep if we need to scale the player
const PLAYER_W_BLOCKS = 1;
const PLAYER_H_BLOCKS = 2;
const PLAYER_D_BLOCKS = 0.5;

//create particle function
async function generateMinecraftParticles(image, maxSize = DEFAULT_MAX_SIZE, spacing = SPACING, particleOffsetX = 0, particleOffsetY = 0, particleOffsetZ = 0, tag = 'particle') {
  let width = image.bitmap.width;
  let height = image.bitmap.height;
  if(width > maxSize || height > maxSize) {
    const scale = Math.min(maxSize / width, maxSize / height);
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
    image.resize({ w: width, h: height, mode: Jimp.RESIZE_NEAREST_NEIGHBOR });
  }
  const halfSizeX = width / 2;
  const baseY = BASE_Y + particleOffsetY + spacing / 2;
  const rowData = [];
  for(let y = 0; y < height; y++) {
    const px = [];
    for(let x = 0; x < width; x++) {
      const { r, g, b, a } = intToRGBA(image.getPixelColor(x, y));
      if(a > 0) px.push({ x, rf: (r / 255).toFixed(3), gf: (g / 255).toFixed(3), bf: (b / 255).toFixed(3), r, g, b, a });
    }
    if(px.length) rowData.push({ y, pixels: px });
  }
  const setblockCmds = [];
  for(const row of rowData) {
    row.pixels.forEach((pixel, pixIdx) => {
      const posX = (particleOffsetX + (pixel.x - halfSizeX + 0.5) * spacing).toFixed(2);
      const posY = (baseY + (height - 1 - row.y) * spacing).toFixed(2);
      const posZ = particleOffsetZ.toFixed(2);
      const particleCmd = `execute as @e[tag=${tag}] at @s run particle dust{color:[${pixel.rf},${pixel.gf},${pixel.bf}],scale:1} ^${posX} ^${posY} ^${posZ} 0 0 0 0 0 normal`;
      const isRepeating = pixIdx === 0;
      const type = isRepeating ? 'repeating_command_block' : 'chain_command_block';
      const auto = isRepeating ? '0b' : '1b';
      setblockCmds.push(`setblock ~${2 + row.y} ~-1 ~${-pixIdx} minecraft:${type}[facing=north]{Command:"${particleCmd}",auto:${auto}} replace`);
    });
  }
  if(!setblockCmds.length) return [];
  return generateOneCommands(setblockCmds);
}

//function to create the one command
function generateOneCommands(setblockCmds) {
  const maxLength = 32500;
  const summonBase = 'summon falling_block ~ ~1 ~ {BlockState:{Name:"activator_rail"},Time:1,Passengers:[';
  const summonEnd = ']}';
  const oneCommands = [];
  let todo = [...setblockCmds];
  while(todo.length > 0) {
    let group = [];
    while(todo.length > 0) {
      group.push(todo.shift());
      if((summonBase + buildPassengers(group) + summonEnd).length > maxLength) {
        todo.unshift(group.pop());
        break;
      }
    }
    if(!group.length) { console.error('Single command too long!'); break; }
    oneCommands.push(summonBase + buildPassengers(group) + summonEnd);
  }
  return oneCommands;
}

function buildPassengers(cmds) {
  const batches = [];
  for(let i = 0; i < cmds.length; i += 10) batches.push(cmds.slice(i, i + 10));
  if(!batches.length) return '';
  let current = ''; let batchId = 0;
  for(let b = batches.length - 1; b >= 0; b--) {
    const t = `batch${batchId++}`;
    let bp = addCart(current, `kill @e[type=command_block_minecart,tag=${t},distance=..3]`, t);
    for(let i = batches[b].length - 1; i >= 0; i--) bp = addCart(bp, batches[b][i], t);
    current = bp;
  }
  return current;
}

function addCart(existing, cmd, tag = '') {
  const esc = cmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const pass = existing ? `,Passengers:[${existing}]` : '';
  return `{id:"command_block_minecart",Command:"${esc}"${tag ? `,Tags:["${tag}"]` : ''}${pass}}`;
}

//change block pixel size based on image
function computePxPerBlock(canvasW, canvasH, imgW, imgH, offX, offY) {
  const PAD = 24;
  //tallest thing
  const particleTop = BASE_Y + offY + imgH * SPACING;
  const sceneH = Math.max(PLAYER_H_BLOCKS, particleTop) + 0.5;
  //widest thing
  const halfPW = (imgW * SPACING) / 2 + Math.abs(offX);
  const sceneW = Math.max(PLAYER_W_BLOCKS / 2, halfPW) * 2 + 0.5;
  const byH = (canvasH - PAD * 2) / sceneH;
  const byW = (canvasW - PAD * 2) / sceneW;
  return Math.min(byH, byW);
}

function drawScene(canvas, isFront, { rowData, imageWidth, imageHeight, offsetX, offsetY, offsetZ, playerImgRef }) {
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  //background with grid
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(249,168,212,0.05)';
  ctx.lineWidth = 1;
  for(let x = 0; x <= W; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for(let y = 0; y <= H; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  //layout anchors
  const pxPerBlock = computePxPerBlock(W, H, imageWidth || 1, imageHeight || 1, offsetX, offsetY);
  const groundY = H - 28;
  const centreX = W / 2;

  //ground line
  ctx.strokeStyle = 'rgba(249,168,212,0.2)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
  ctx.setLineDash([]);

  //player
  const pH = PLAYER_H_BLOCKS * pxPerBlock;
  const pW = (isFront ? PLAYER_W_BLOCKS : PLAYER_D_BLOCKS) * pxPerBlock;
  const pLeft = centreX - pW / 2;
  const pTop = groundY - pH;

  if(playerImgRef.current) {
    if(isFront) {
      ctx.drawImage(playerImgRef.current, pLeft, pTop, pW, pH);
    } else {
      //console.log(pLeft, pTop, pW, pH);
      drawSideFromSprite(ctx, playerImgRef.current, pLeft, pTop, pW, pH);
    }
  } else {
    //draw backup player just in case player image fails to load
    drawFallbackPlayer(ctx, centreX, groundY, pW, pH, !isFront);
  }

  //particles
  if(rowData.length > 0) {
    const halfImgW = imageWidth / 2;
    const baseYVal = BASE_Y + offsetY + SPACING / 2;
    const dotSize = Math.max(1.5, SPACING * pxPerBlock);

    rowData.forEach(({ y: rowY, pixels }) => {
      pixels.forEach(pixel => {
        const mcX = offsetX + (pixel.x - halfImgW + 0.5) * SPACING;
        const mcY = baseYVal + (imageHeight - 1 - rowY) * SPACING;

        //front view and side view changes
        const horizMc = isFront ? mcX : offsetZ;
        const cx = centreX + horizMc * pxPerBlock;
        const cy = groundY - mcY * pxPerBlock;

        ctx.fillStyle = `rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a / 255})`;
        ctx.fillRect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize);
      });
    });
  }

  //label for the preview
  ctx.fillStyle = 'rgba(249,168,212,0.45)';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(isFront ? 'FRONT  (X · Y)' : 'SIDE  (Z · Y)', 8, 16);

  //block scale bar
  const barPx = pxPerBlock;
  const barX = W - 14 - barPx;
  const barY = H - 14;
  ctx.strokeStyle = 'rgba(249,168,212,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(barX, barY); ctx.lineTo(barX + barPx, barY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(barX, barY - 4); ctx.lineTo(barX, barY + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(barX + barPx, barY - 4); ctx.lineTo(barX + barPx, barY + 4); ctx.stroke();
  ctx.fillStyle = 'rgba(249,168,212,0.4)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('1 Block', barX + barPx / 2, barY - 6);
  ctx.textAlign = 'left';
}

//draw side from the image using the rightmost column
function drawSideFromSprite(ctx, img, left, top, widthPx, heightPx) {
  //offscreen canvas to pixel the image
  const tmp = document.createElement('canvas');
  tmp.width = img.naturalWidth;
  tmp.height = img.naturalHeight;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0);

  const srcX = Math.floor(img.naturalWidth * 0.4);
  const srcH = img.naturalHeight;
  const rowH = heightPx / srcH;

  for(let sy = 0; sy < srcH; sy++) {
    const px = tc.getImageData(srcX, sy, 1, 1).data;
    if(px[3] === 0) continue;
    ctx.fillStyle = `rgba(${px[0]},${px[1]},${px[2]},${px[3] / 255})`;
    ctx.fillRect(left, top + sy * rowH, widthPx, Math.ceil(rowH) + 0.5);
  }
}

//emplate player in case player image fails to load...
function drawFallbackPlayer(ctx, centreX, groundY, w, h, isSide) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  const l = centreX - w / 2;
  const t = groundY - h;
  ctx.fillStyle = '#f9a8d4'; ctx.fillRect(l, t, w, h * 0.25);
  ctx.fillStyle = '#e879a0'; ctx.fillRect(l, t + h * 0.25, w, h * 0.375);
  ctx.fillStyle = '#c4648a';
  if(isSide) {
    ctx.fillRect(l, t + h * 0.625, w, h * 0.375);
  } else {
    const lw = w * 0.45;
    ctx.fillRect(l, t + h * 0.625, lw, h * 0.375);
    ctx.fillRect(l + w - lw, t + h * 0.625, lw, h * 0.375);
  }
  ctx.restore();
}

//toast for any errors or messages
const Toast = ({ toasts }) => (
  <div className={styles.toastContainer}>
    {toasts.map(t => (
      <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
        <span className={styles.toastIcon}>{t.type === 'success' ? '✨' : t.type === 'error' ? '💔' : 'ℹ️'}</span>
        {t.message}
      </div>
    ))}
  </div>
);

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 260, h: 340 });

  const frontCanvasRef = useRef(null);
  const sideCanvasRef = useRef(null);
  const playerImgRef = useRef(null);
  const previewRef = useRef(null);

  //toast creation with timer
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  //player
  useEffect(() => {
    const img = new Image();
    img.src = Vivtorsing;
    img.onload = () => { playerImgRef.current = img; };
    img.onerror = () => { playerImgRef.current = null; };
  }, []);

  //adjust canvas size based on image scale
  useEffect(() => {
    const measure = () => {
      if(!previewRef.current) return;
      const total = previewRef.current.clientWidth;
      const cw = Math.max(120, Math.floor((total - 12) / 2));
      const ch = Math.round(cw * 1.35);
      setCanvasSize({ w: cw, h: ch });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if(previewRef.current) ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, []);

  //process image
  useEffect(() => {
    if(!originalImage) return;
    const image = originalImage.clone();
    let w = image.bitmap.width;
    let h = image.bitmap.height;
    const sf = Math.min(maxSize / w, maxSize / h);
    if(sf < 1) {
      w = Math.floor(w * sf); h = Math.floor(h * sf);
      image.resize({ w, h, mode: Jimp.RESIZE_NEAREST_NEIGHBOR });
    }
    const rd = [];
    for(let y = 0; y < h; y++) {
      const px = [];
      for(let x = 0; x < w; x++) {
        const { r, g, b, a } = intToRGBA(image.getPixelColor(x, y));
        if(a > 0) px.push({ x, r, g, b, a });
      }
      if(px.length) rd.push({ y, pixels: px });
    }
    setRowData(rd);
    setImageWidth(w);
    setImageHeight(h);
  }, [originalImage, maxSize]);

  //redraw the preview
  useEffect(() => {
    const shared = { rowData, imageWidth, imageHeight, offsetX, offsetY, offsetZ, playerImgRef };
    drawScene(frontCanvasRef.current, true, shared);
    drawScene(sideCanvasRef.current, false, shared);
  }, [rowData, imageWidth, imageHeight, offsetX, offsetY, offsetZ, canvasSize]);

  //upload image
  const processFile = useCallback(async (file) => {
    if(!file) return;
    if(!file.type.startsWith('image/')) {
      addToast("That file doesn't look like an image! Try a PNG 🖼️", 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const image = await Jimp.read(ev.target.result);
        setOriginalImage(image);
        addToast('Image loaded! ✨', 'success');
      } catch {
        addToast("Couldn't read that image — is it a valid PNG/JPG?", 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [addToast]);

  const handleUpload = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); };

  //generate the command
  const handleGenerate = async () => {
    if(!originalImage) { addToast('Upload an image first! 🌸', 'info'); return; }
    setIsGenerating(true);
    try {
      const commands = await generateMinecraftParticles(originalImage.clone(), maxSize, SPACING, offsetX, offsetY, offsetZ, tag);
      setGeneratedCommands(commands);
      addToast(`Generated ${commands.length} command${commands.length !== 1 ? 's' : ''}! 🎉`, 'success');
    } catch {
      addToast('Something went wrong generating commands 😢', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (cmd, i) => {
    navigator.clipboard.writeText(cmd)
      .then(() => addToast(`Command ${i + 1} copied! ✨`, 'success'))
      .catch(() => addToast('Copy failed — try selecting manually.', 'error'));
  };

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} />

      <div className={styles.header}>
        <div className={styles.pixelDeco}>✦</div>
        <h1 className={styles.title}>Particle Image Generator</h1>
        <p className={styles.subtitle}>Turn any image into Minecraft particles ✨</p>
        <div className={styles.pixelDeco}>✦</div>
      </div>

      <div className={styles.main}>

        <div className={styles.left}>
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${originalImage ? styles.hasImage : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input id="fileInput" type="file" accept="image/*" onChange={handleUpload} hidden />
            {originalImage ? (
              <><span className={styles.dropIcon}>🖼️</span>
                <span className={styles.dropLabel}>Image loaded!</span>
                <span className={styles.dropSub}>Click or drop to replace</span></>
            ) : (
              <><span className={styles.dropIcon}>🌸</span>
                <span className={styles.dropLabel}>Drop image here</span>
                <span className={styles.dropSub}>or click to browse · PNG · JPG</span></>
            )}
          </div>

          <div className={styles.controls}>
            <div className={styles.field}>
              <label className={styles.label}>Max Size</label>
              <div className={styles.rangeRow}>
                <input type="range" min={MIN_SIZE} max={DEFAULT_MAX_SIZE} value={maxSize}
                  onChange={e => setMaxSize(Number(e.target.value))} className={styles.range} />
                <span className={styles.rangeVal}>{maxSize}px</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Entity Tag</label>
              <input type="text" value={tag} className={styles.input}
                onChange={e => setTag(e.target.value)} placeholder="particle" />
            </div>

            <div className={styles.offsetGrid}>
              {[
                { label: 'Offset X', val: offsetX, set: setOffsetX },
                { label: 'Offset Y', val: offsetY, set: setOffsetY },
                { label: 'Offset Z', val: offsetZ, set: setOffsetZ },
              ].map(({ label, val, set }) => (
                <div className={styles.field} key={label}>
                  <label className={styles.label}>{label}</label>
                  <input type="number" value={val} step="0.1" className={styles.input}
                    onChange={e => set(parseFloat(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className={`${styles.button} ${isGenerating ? styles.loading : ''}`}
            disabled={isGenerating}
          >
            {isGenerating
              ? <><span className={styles.spinner} /> Generating…</>
              : '✨ Generate One Commands'}
          </button>

          {generatedCommands.length > 0 && (
            <div className={styles.commands}>
              <h3 className={styles.commandsTitle}>
                Generated {generatedCommands.length} command{generatedCommands.length !== 1 ? 's' : ''}
              </h3>
              <div className={styles.commandList}>
                {generatedCommands.map((cmd, i) => (
                  <button key={i} onClick={() => handleCopy(cmd, i)} className={styles.copyButton}>
                    <span className={styles.copyNum}>#{i + 1}</span>
                    <span className={styles.copyText}>Copy Command</span>
                    <span className={styles.copyIcon}>📋</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/*preview area*/}
        <div className={styles.right}>
          <h3 className={styles.previewTitle}>Preview</h3>
          <div className={styles.preview} ref={previewRef}>
            <div className={styles.canvasWrap}>
              <h4 className={styles.viewLabel}>Front (X)</h4>
              <canvas ref={frontCanvasRef} width={canvasSize.w} height={canvasSize.h} className={styles.canvas} />
            </div>
            <div className={styles.canvasWrap}>
              <h4 className={styles.viewLabel}>Side (Z)</h4>
              <canvas ref={sideCanvasRef} width={canvasSize.w} height={canvasSize.h} className={styles.canvas} />
            </div>
          </div>
        </div>
      </div>

      {/*tutorial area*/}
      <div className={styles.tutorial}>
        <h3 className={styles.tutTitle}>📖 How to use</h3>
        <ol className={styles.tutList}>
          <li>Tag the entity that will display the particles:<br />
            <code className={styles.code}>/tag @e[type=player,limit=1] add {tag}</code>
          </li>
          <li>Back up your world before running any one-command.</li>
          <li>Place a command block and paste the first one-command in.</li>
          <li>Activate it with a lever and wait for all minecarts to vanish.</li>
          <li>Repeat for each additional command in order.</li>
          <li>Add levers to the placed command blocks to activate the particle loop.</li>
        </ol>
      </div>
    </div>
  );
};

export default ParticleGen;